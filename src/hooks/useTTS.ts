"use client";

import { useState, useEffect } from "react";
import {
  getCurrentSpeaker,
  subscribeCurrentSpeaking,
  speakText,
  type SpeakerState,
} from "@/lib/tts";

/**
 * Per-message hook. Returns the current play phase for this message
 * and a convenience speak() wrapper. All global coordination lives in tts.ts.
 */
export function useTTS(messageId: string) {
  const [phase, setPhase] = useState<NonNullable<SpeakerState>["phase"] | null>(() => {
    const s = getCurrentSpeaker();
    return s?.id === messageId ? s.phase : null;
  });

  useEffect(() => {
    return subscribeCurrentSpeaking(() => {
      const s = getCurrentSpeaker();
      setPhase(s?.id === messageId ? s.phase : null);
    });
  }, [messageId]);

  return {
    phase,                              // null | "generating" | "playing"
    isSpeaking: phase === "playing",
    isGenerating: phase === "generating",
    isActive: phase !== null,
    speak: (text: string) => speakText(text, messageId),
  };
}
