import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "No API key", code: "no_api_key" }), { status: 500 });
  }

  const { currentOutput, refinementRequest, conversationContext } = await req.json();

  const prompt = `The user has this structured output that was just generated:

${currentOutput}

They want to refine it with this request: "${refinementRequest}"

Rewrite the structured output incorporating their feedback. Keep the same format (checklist/plan/comparison/draft/breakdown markdown blocks). Only return the conversational intro sentence + the updated block. Don't explain what you changed.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are Clyde, a warm helpful AI. Refine structured outputs as requested. Keep the same markdown format." },
            ...(conversationContext || []),
            { role: "user", content: prompt },
          ],
          temperature: 0.6,
          max_tokens: 700,
          stream: true,
        });
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) send(JSON.stringify({ type: "delta", text: delta }));
          if (chunk.choices[0]?.finish_reason) send(JSON.stringify({ type: "done" }));
        }
      } catch (e: unknown) {
        send(JSON.stringify({ type: "error", message: "Refine failed" }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
