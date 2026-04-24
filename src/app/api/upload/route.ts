import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getIp } from "@/lib/rateLimit";

/**
 * POST /api/upload
 *
 * Accepts a multipart form with a single "file" field.
 * Uploads to Supabase Storage (bucket: clyde-share, must be set to public).
 * Returns { url: string, fileName: string } on success.
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * The bucket needs to exist with public access enabled:
 *   Supabase dashboard → Storage → New bucket → Name: clyde-share → Public: ✓
 */

const BUCKET = "clyde-share";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "text/plain",
]);

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`upload:${getIp(req)}`, 5, 60_000)) {
    return new Response(JSON.stringify({ error: "Too many uploads. Try again in a minute." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(
      JSON.stringify({ error: "Storage not configured — add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid form data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return new Response(JSON.stringify({ error: "No file field" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(JSON.stringify({ error: "Unsupported file type." }), {
      status: 415,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: "File too large (max 8 MB)" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const slug = Math.random().toString(36).slice(2, 9);
  const path = `${Date.now()}-${slug}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return new Response(JSON.stringify({ url: data.publicUrl, fileName: file.name }), {
    headers: { "Content-Type": "application/json" },
  });
}
