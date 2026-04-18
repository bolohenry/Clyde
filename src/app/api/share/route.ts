import { NextRequest } from "next/server";
import { StructuredContent } from "@/types";

// In-memory store (resets on cold start). For production, swap for Vercel KV.
const store = new Map<string, { content: StructuredContent; expiresAt: number }>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export async function POST(req: NextRequest) {
  const { content } = await req.json() as { content: StructuredContent };
  if (!content) return new Response(JSON.stringify({ error: "No content" }), { status: 400 });

  const id = generateId();
  store.set(id, { content, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  return new Response(JSON.stringify({ id }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new Response(JSON.stringify({ error: "No id" }), { status: 400 });

  const entry = store.get(id);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(id ?? "");
    return new Response(JSON.stringify({ error: "Not found or expired" }), { status: 404 });
  }

  return new Response(JSON.stringify({ content: entry.content }), {
    headers: { "Content-Type": "application/json" },
  });
}
