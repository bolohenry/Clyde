import { NextRequest } from "next/server";

/**
 * /api/link — stores and retrieves "Send to Clyde" link payloads.
 *
 * Distinct from /api/share (which holds structured output cards).
 * This stores free-text + optional file URL for the /create → /?link= flow.
 *
 * POST { text, fileUrl?, fileName?, fileType? } → { id }
 * GET  ?id=[id]                                 → { text, fileUrl?, fileName?, fileType? }
 */

export type LinkPayload = {
  text: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
};

// ── Vercel KV (same pattern as /api/share) ────────────────────────────────────
type KVStore = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>;
};

let kvCache: KVStore | null | undefined = undefined;

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

// ── In-memory fallback (resets on cold start — fine for local dev) ─────────────
const store = new Map<string, { payload: LinkPayload; expiresAt: number }>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

const TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.text && !body?.fileUrl) {
    return new Response(JSON.stringify({ error: "Payload must include text or fileUrl" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload: LinkPayload = {
    text: body.text ?? "",
    fileUrl: body.fileUrl,
    fileName: body.fileName,
    fileType: body.fileType,
  };

  const id = generateId();
  const db = await getKV();

  if (db) {
    await db.set(`link:${id}`, payload, { ex: TTL_SECONDS });
  } else {
    store.set(id, { payload, expiresAt: Date.now() + TTL_SECONDS * 1000 });
  }

  return new Response(JSON.stringify({ id }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "No id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const db = await getKV();

  if (db) {
    const payload = await db.get<LinkPayload>(`link:${id}`);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Not found or expired" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // In-memory fallback
  const entry = store.get(id);
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(id);
    return new Response(JSON.stringify({ error: "Not found or expired" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(entry.payload), {
    headers: { "Content-Type": "application/json" },
  });
}
