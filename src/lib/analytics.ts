// Thin wrapper around Plausible analytics.
// Add Plausible script to layout.tsx with your domain to activate.
// Falls back to console.log in development.

type EventProperties = Record<string, string | number | boolean>;

export function track(event: string, props?: EventProperties) {
  if (typeof window === "undefined") return;

  // Plausible
  if (typeof (window as Window & { plausible?: (event: string, opts?: { props?: EventProperties }) => void }).plausible === "function") {
    (window as Window & { plausible?: (event: string, opts?: { props?: EventProperties }) => void }).plausible!(event, props ? { props } : undefined);
    return;
  }

  // Dev fallback
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event}`, props);
  }
}
