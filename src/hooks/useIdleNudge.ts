"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ConversationPhase, Message } from "@/types";

export interface NudgeConfig {
  text: string;
}

function getNudge(phase: ConversationPhase, turnCount: number): NudgeConfig | null {
  switch (phase) {
    case "conversation":
      if (turnCount <= 2) {
        return { text: "Still thinking? I can turn this into a plan, list, or draft — just ask." };
      }
      return { text: "Want me to make something concrete out of this? A plan, list, or draft." };
    case "flexible":
      return { text: "What else have you got going on?" };
    case "transition":
      return { text: "What do you want to try next?" };
    // Don't nudge during structured (TransitionCue handles it) or explanation
    default:
      return null;
  }
}

export function useIdleNudge({
  messages,
  phase,
  turnCount,
  enabled = true,
  delay = 10000,
}: {
  messages: Message[];
  phase: ConversationPhase;
  turnCount: number;
  enabled?: boolean;
  delay?: number;
}) {
  const [nudge, setNudge] = useState<NudgeConfig | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef(false);
  const messageCountRef = useRef(messages.length);

  const dismiss = useCallback(() => {
    setNudge(null);
    shownRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNudge(null);
    shownRef.current = false;
  }, []);

  // Reset when a new message arrives
  useEffect(() => {
    if (messages.length !== messageCountRef.current) {
      messageCountRef.current = messages.length;
      resetTimer();
    }
  }, [messages.length, resetTimer]);

  // Reset (and hide nudge) when user starts typing
  useEffect(() => {
    const onKey = () => {
      if (nudge) setNudge(null);
      shownRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    document.addEventListener("keydown", onKey, { passive: true });
    return () => document.removeEventListener("keydown", onKey);
  }, [nudge]);

  // Start idle timer after last Clyde message settles
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!enabled || shownRef.current) return;

    const lastMsg = messages[messages.length - 1];
    const clydeIdle =
      lastMsg?.role === "clyde" &&
      !lastMsg.isTyping &&
      !lastMsg.isError &&
      !lastMsg.isDivider &&
      !lastMsg.isInsight;

    if (!clydeIdle) return;

    const config = getNudge(phase, turnCount);
    if (!config) return;

    timerRef.current = setTimeout(() => {
      if (!shownRef.current) {
        shownRef.current = true;
        setNudge(config);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [messages, phase, turnCount, enabled, delay]);

  return { nudge, dismissNudge: dismiss };
}
