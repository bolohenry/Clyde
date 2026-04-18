"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import { generateWelcomeMessage } from "@/engine/responses";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TransitionCue from "./TransitionCue";
import ExplanationPanel from "./ExplanationPanel";
import WhatElseCanAI from "./WhatElseCanAI";
import Header from "./Header";
import TypewriterMessage from "./TypewriterMessage";
import ClydeAvatar from "./ClydeAvatar";
import StarterScenarios from "./StarterScenarios";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const { state, dispatch, resetConversation, hasSavedConversation } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const userScrolledUpRef = useRef(false);
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // For screen reader phase announcements
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const prevPhaseRef = useRef(state.phase);
  // If restoring a saved conversation, jump straight to chat
  const [uiPhase, setUiPhase] = useState<"hero" | "typewriter" | "chat">(
    hasSavedConversation ? "chat" : "hero"
  );

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollRef.current) return;
    if (!force && userScrolledUpRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  // Detect when user scrolls up manually
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    userScrolledUpRef.current = distanceFromBottom > 80;
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!hasSavedConversation) {
      setUiPhase("typewriter");
    }
  }, [hasSavedConversation]);

  const finishTypewriter = useCallback(() => {
    if (uiPhase !== "chat") {
      const welcomeMsg = generateWelcomeMessage();
      if (!state.messages.some((m) => m.id === "welcome-msg")) {
        dispatch({ type: "ADD_MESSAGE", message: welcomeMsg });
      }
      setUiPhase("chat");
    }
  }, [uiPhase, state.messages, dispatch]);

  useEffect(() => {
    const hasUserMessage = state.messages.some((m) => m.role === "user");
    if (hasUserMessage && uiPhase !== "chat") {
      finishTypewriter();
    }
  }, [state.messages, uiPhase, finishTypewriter]);

  useEffect(() => {
    // New message from Clyde — always scroll (force=true resets user scroll tracking)
    const lastMsg = state.messages[state.messages.length - 1];
    const isNewClydeMsg = lastMsg && lastMsg.role === "clyde" && !lastMsg.isTyping;
    if (isNewClydeMsg) {
      userScrolledUpRef.current = false;
    }

    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => scrollToBottom(), 150);
    return () => {
      if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    };
  }, [
    state.messages,
    state.showTransitionCue,
    state.explanationVisible,
    uiPhase,
    scrollToBottom,
  ]);

  // Announce phase transitions to screen readers
  useEffect(() => {
    if (!liveRegionRef.current) return;
    const prev = prevPhaseRef.current;
    const next = state.phase;
    prevPhaseRef.current = next;
    if (prev === next) return;

    const announcements: Partial<Record<typeof next, string>> = {
      structured: "Clyde created something for you.",
      explanation: "Explanation panel open.",
      flexible: "Continue the conversation or try something new.",
      transition: "You just used AI.",
    };
    const msg = announcements[next];
    if (msg) liveRegionRef.current.textContent = msg;
  }, [state.phase]);

  const welcomeText = generateWelcomeMessage().text;

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--surface-page)] transition-colors duration-200">
      {/* Screen-reader live region for phase announcements */}
      <div
        ref={liveRegionRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
      <Header />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none pt-16 sm:pt-20 pb-2"
      >
        <div className="max-w-2xl mx-auto px-3 sm:px-4">
          {/* Phase 1: Meet Clyde — character-first hero */}
          <AnimatePresence>
            {uiPhase === "hero" && (
              <motion.div
                key="hero"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
                onClick={() => setUiPhase("typewriter")}
                className="flex flex-col items-center justify-center min-h-[55vh] text-center py-12 cursor-pointer select-none"
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ClydeAvatar size="xl" expression="happy" animate={false} />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-2xl sm:text-3xl font-semibold text-surface-800 dark:text-surface-100 mt-5 mb-2"
                >
                  Hey, I&apos;m Clyde
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="text-surface-500 dark:text-surface-400 text-sm sm:text-base max-w-xs leading-relaxed"
                >
                  Tell me what&apos;s on your mind. I&apos;ll show you what AI can actually do.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Clyde types the welcome message */}
          {uiPhase === "typewriter" && (
            <div className="pt-4 sm:pt-8">
              <TypewriterMessage
                text={welcomeText}
                speed={14}
                onComplete={finishTypewriter}
              />
            </div>
          )}

          {/* Phase 3: Full chat mode */}
          {uiPhase === "chat" && (
            <>
              {/* Restore banner */}
              <div
                className="space-y-5 pt-1"
                role="log"
                aria-label="Conversation with Clyde"
                aria-live="polite"
              >
                {state.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>

              {/* Starter scenarios — shown after welcome, before first user message */}
              {!state.messages.some((m) => m.role === "user") && (
                <StarterScenarios />
              )}

              <TransitionCue />
              <ExplanationPanel />
              {/* Show WhatElseCanAI in flexible phase if explanation was skipped */}
              {state.phase === "flexible" && !state.explanationVisible && state.hasCompletedFirstFlow && (
                <WhatElseCanAI />
              )}
            </>
          )}

          <div className="h-2" />
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
