"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import { generateWelcomeMessage } from "@/engine/responses";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TransitionCue from "./TransitionCue";
import ExplanationPanel from "./ExplanationPanel";
import Header from "./Header";
import TypewriterMessage from "./TypewriterMessage";
import ClydeAvatar from "./ClydeAvatar";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const { state, dispatch } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);
  const [uiPhase, setUiPhase] = useState<"hero" | "typewriter" | "chat">(
    "hero"
  );

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    setTimeout(() => {
      setUiPhase("typewriter");
    }, 1400);
  }, []);

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
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [
    state.messages,
    state.showTransitionCue,
    state.explanationVisible,
    uiPhase,
    scrollToBottom,
  ]);

  const welcomeText = generateWelcomeMessage().text;

  return (
    <div className="flex flex-col h-[100dvh] bg-surface-50">
      <Header />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin pt-16 sm:pt-20 pb-2"
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
                className="flex flex-col items-center justify-center min-h-[55vh] text-center py-12"
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
                  className="text-2xl sm:text-3xl font-semibold text-surface-800 mt-5 mb-2"
                >
                  {"Hey, I'm Clyde"}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="text-surface-500 text-sm sm:text-base max-w-xs leading-relaxed"
                >
                  I help people learn AI by doing real things — not lectures.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Clyde types the welcome message */}
          {uiPhase === "typewriter" && (
            <div className="pt-4 sm:pt-8">
              <TypewriterMessage
                text={welcomeText}
                speed={22}
                onComplete={finishTypewriter}
              />
            </div>
          )}

          {/* Phase 3: Full chat mode */}
          {uiPhase === "chat" && (
            <>
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

              <TransitionCue />
              <ExplanationPanel />
            </>
          )}

          <div className="h-2" />
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
