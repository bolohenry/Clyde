import posthog from "posthog-js";

type EventProperties = Record<string, string | number | boolean>;

export function track(event: string, props?: EventProperties) {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event}`, props ?? "");
  }
  posthog.capture(event, props);
}
