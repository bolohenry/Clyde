"use client";

import { useState, useEffect } from "react";
import {
  getCurrentSpeaker,
  subscribeCurrentSpeaking,
  speakText,
  subscribeKokoro,
  getKokoroStatus,
  getKokoroProgress,
  type SpeakerState,
  type KokoroStatus,
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
  const [kokoroStatus, setKokoroStatus] = useState<KokoroStatus>(() => getKokoroStatus());
  const [kokoroProgress, setKokoroProgress] = useState<number>(() => getKokoroProgress());

  useEffect(() => {
    return subscribeCurrentSpeaking(() => {
      const s = getCurrentSpeaker();
      setPhase(s?.id === messageId ? s.phase : null);
    });
  }, [messageId]);

  useEffect(() => {
    return subscribeKokoro(() => {
      setKokoroStatus(getKokoroStatus());
      setKokoroProgress(getKokoroProgress());
    });
  }, []);

  return {
    phase,
    isSpeaking: phase === "playing",
    isGenerating: phase === "generating",
    isActive: phase !== null,
    kokoroStatus,
    kokoroProgress,
    speak: (text: string) => speakText(text, messageId),
  };
}
