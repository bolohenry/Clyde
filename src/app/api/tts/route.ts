import { NextRequest } from "next/server";
import { checkRateLimit, getIp } from "@/lib/rateLimit";

const MAX_CHARS = 4096; // OpenAI TTS limit

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`tts:${getIp(req)}`, 30, 60_000)) {
    return new Response(JSON.stringify({ error: "Too many requests." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OpenAI API key not configured." }), {
      status: 503, headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_CHARS) : "";
  if (!text) {
    return new Response(JSON.stringify({ error: "No text provided." }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text,
      voice: "nova",
      response_format: "mp3",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ error: err?.error?.message ?? "TTS request failed." }),
      { status: res.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream audio directly back to the client
  return new Response(res.body, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
