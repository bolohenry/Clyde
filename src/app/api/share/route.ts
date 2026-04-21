import { NextRequest } from "next/server";
import { StructuredContent } from "@/types";

// ── Vercel KV (used when env vars are present) ───────────────────────────────
// Run `vercel env pull` locally or add these in the Vercel dashboard:
//   KV_REST_API_URL, KV_REST_API_TOKEN
// The KV_REST_API_READ_ONLY_TOKEN var is also set by Vercel automatically.

type KVStore = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>;
};

let kvCache: KVStore | null | undefined = undefined; // undefined = not yet resolved

async function getKV(): Promise<KVStore | null> {
  if (kvCache !== undefined) return kvCache;
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    kvCache = null;
    return null;
  }
  try {
    const mod = await import("@vercel/kv");
    kvCache = mod.kv as KVStore;
    return kvCache;
  } catch {
    kvCache = null;
    return null;
  }
}

// ── In-memory fallback (resets on cold start — fine for local dev) ────────────
const store = new Map<string, { content: StructuredContent; expiresAt: number }>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.content) {
    return new Response(JSON.stringify({ error: "No content" }), { status: 400 });
  }

  const { content } = body as { content: StructuredContent };
  const id = generateId();

  const db = await getKV();
  if (db) {
    await db.set(`share:${id}`, content, { ex: TTL_SECONDS });
  } else {
    store.set(id, { content, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }

  return new Response(JSON.stringify({ id }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "No id" }), { status: 400 });
  }

  const db = await getKV();

  if (db) {
    const content = await db.get<StructuredContent>(`share:${id}`);
    if (!content) {
      return new Response(JSON.stringify({ error: "Not found or expired" }), { status: 404 });
    }
    return new Response(JSON.stringify({ content }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fallback: in-memory
  const entry = store.get(id);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(id);
    return new Response(JSON.stringify({ error: "Not found or expired" }), { status: 404 });
  }
  return new Response(JSON.stringify({ content: entry.content }), {
    headers: { "Content-Type": "application/json" },
  });
}
