import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildMessages } from "@/engine/prompt";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: NextRequest) {
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
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "messages array required", code: "bad_request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Sanitize: only allow valid roles and string content
  const sanitized = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 4000) }));

  if (sanitized.length === 0) {
    return new Response(
      JSON.stringify({ error: "No valid messages", code: "bad_request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const fullMessages = buildMessages(sanitized);

  // Stream via SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: fullMessages,
          temperature: 0.8,
          max_tokens: 1024,
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
