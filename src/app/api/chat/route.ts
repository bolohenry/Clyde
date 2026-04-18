import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildMessages, CLYDE_SYSTEM_PROMPT } from "@/engine/prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

/* ── Simple in-memory rate limiter ───────────────────────────
   Keyed on IP. Allows RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS.
   State lives in the serverless instance — resets on cold start, but
   protects against bursts within a warm instance.
   ──────────────────────────────────────────────────────────── */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 20; // max requests per window

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({ error: "Too many requests — slow down a bit.", code: "rate_limit" }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY not configured", code: "no_api_key" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body", code: "bad_request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = body as {
    messages: { role: "user" | "assistant"; content: string | unknown[] }[];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array required", code: "bad_request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Sanitize: allow string content or vision array content
  const sanitized = messages
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
    .map((m) => {
      if (typeof m.content === "string") {
        if (!m.content.trim()) return null;
        return { role: m.role, content: m.content.trim().slice(0, 15000) };
      }
      // Vision format: array of content parts
      if (Array.isArray(m.content)) {
        return { role: m.role, content: m.content };
      }
      return null;
    })
    .filter(Boolean) as { role: "user" | "assistant"; content: string | unknown[] }[];

  if (sanitized.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid messages", code: "bad_request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Use gpt-4o when any message contains vision content (array format)
  const hasVision = sanitized.some((m) => Array.isArray(m.content));
  const model = hasVision ? "gpt-4o" : "gpt-4o-mini";

  // For vision requests, prepend system prompt manually since buildMessages only accepts strings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fullMessages: any[] = hasVision
    ? [{ role: "system", content: CLYDE_SYSTEM_PROMPT }, ...sanitized]
    : buildMessages(
        sanitized.map((m) => ({
          role: m.role,
          content: m.content as string,
        }))
      );

  // Stream via SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 900,
          stream: true,
        });

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            send(JSON.stringify({ type: "delta", text: delta }));
          }
          if (chunk.choices[0]?.finish_reason) {
            send(JSON.stringify({ type: "done" }));
          }
        }
      } catch (error: unknown) {
        const err = error as { status?: number; message?: string };
        if (err?.status === 429) {
          send(JSON.stringify({ type: "error", code: "rate_limit", message: "Rate limit hit — try again in a moment." }));
        } else {
          send(JSON.stringify({ type: "error", code: "llm_error", message: err?.message || "LLM request failed." }));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
