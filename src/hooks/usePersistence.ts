"use client";

import { useEffect, useCallback } from "react";
import { ConversationState } from "@/types";
import { initialState } from "@/engine/conversation";

const STORAGE_KEY = "clyde_conversation_v1";
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PersistedData {
  state: ConversationState;
  savedAt: number;
}

export function loadPersistedState(): ConversationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: PersistedData = JSON.parse(raw);
    if (!data.state || !data.savedAt) return null;
    // Expire after 24h
    if (Date.now() - data.savedAt > EXPIRY_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // Strip transient UI state before restoring
    return {
      ...data.state,
      showTransitionCue: false,
      explanationVisible: false,
      // Remove messages that were mid-typing or errored
      messages: data.state.messages.filter((m) => !m.isTyping && !m.isError),
    };
  } catch {
    return null;
  }
}

export function clearPersistedState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function usePersistence(state: ConversationState) {
  const persist = useCallback(() => {
    if (typeof window === "undefined") return;
    // Only save once there's actual conversation content
    if (state.messages.length === 0) return;
    const data: PersistedData = { state, savedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota exceeded — ignore
    }
  }, [state]);

  useEffect(() => {
    persist();
  }, [persist]);
}
