import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

const EXPLAIN_SYSTEM_PROMPT = `You are Clyde. A user just had a real conversation with you and you produced a helpful output for them.
Explain what happened in a warm, direct way — like a friend reflecting after helping you with something.

Write exactly 3 short paragraphs, each 1–2 sentences:
1. What you noticed in their messages that told you what kind of help they needed (be specific to the actual content, not generic)
2. Why producing a [ACTION] was the right move for what they described
3. One specific thing they could try next with AI, based on what they just did

Rules:
- Be specific to their actual situation. Don't be generic.
- No headers, no bullet points, no markdown. Just plain conversational paragraphs.
- Keep each paragraph to 1–2 sentences. Be terse.
- Don't say "As an AI" or "I noticed that" — just say what you noticed.`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "No API key", code: "no_api_key" }), { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400 });

  const { conversationHistory, action, userContext } = body as {
    conversationHistory: { role: "user" | "assistant"; content: string }[];
    action: string;
    userContext: string[];
  };

  const systemPrompt = EXPLAIN_SYSTEM_PROMPT.replace(/\[ACTION\]/g, action);
  const contextNote = userContext.length > 0
    ? `Context tags detected: ${userContext.join(", ")}.`
    : "";

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...conversationHistory,
    {
      role: "user" as const,
      content: `${contextNote} The output you just produced was a "${action}". Now explain what you did.`,
    },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.6,
          max_tokens: 350,
          stream: true,
        });
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) send(JSON.stringify({ type: "delta", text: delta }));
          if (chunk.choices[0]?.finish_reason) send(JSON.stringify({ type: "done" }));
        }
      } catch {
        send(JSON.stringify({ type: "error", code: "llm_error" }));
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
    },
  });
}
