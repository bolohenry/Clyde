import { NextRequest } from "next/server";
import { put, list } from "@vercel/blob";
import { checkRateLimit, getIp } from "@/lib/rateLimit";

/**
 * /api/link — stores and retrieves "Send to Clyde" link payloads.
 *
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is present (production),
 * falls back to in-memory for local dev.
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

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ── In-memory fallback (local dev only) ───────────────────────────────────────
const store = new Map<string, { payload: LinkPayload; expiresAt: number }>();
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ── POST ──────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`link:${getIp(req)}`, 20, 60_000)) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again in a minute." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(`links/${id}.json`, JSON.stringify(payload), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    });
  } else {
    store.set(id, { payload, expiresAt: Date.now() + TTL_MS });
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

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: `links/${id}` });
    if (!blobs.length) {
      return new Response(JSON.stringify({ error: "Not found or expired" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const res = await fetch(blobs[0].url);
    const payload = await res.json();
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
