"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "clyde_autoplay";
const CHANGE_EVENT = "clyde_autoplay_change";

/**
 * Persists auto-play preference to localStorage and keeps all
 * components that call this hook in sync via a custom window event.
 */
export function useAutoPlay() {
  const [autoPlay, setAutoPlayState] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  // Listen for changes from other component instances
  useEffect(() => {
    const handler = (e: Event) => {
      setAutoPlayState((e as CustomEvent<boolean>).detail);
    };
    window.addEventListener(CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHANGE_EVENT, handler);
  }, []);

  const toggle = useCallback(() => {
    const next = !autoPlay;
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new CustomEvent<boolean>(CHANGE_EVENT, { detail: next }));
    setAutoPlayState(next);
  }, [autoPlay]);

  return { autoPlay, toggle };
}
