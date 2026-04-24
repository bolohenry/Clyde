const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = buckets.get(key) ?? [];
  const window = prev.filter((t) => now - t < windowMs);
  if (window.length >= limit) return false;
  window.push(now);
  buckets.set(key, window);
  return true;
}

export function getIp(req: { headers: { get(name: string): string | null } }): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
