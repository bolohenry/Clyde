"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import { generateWelcomeMessage } from "@/engine/responses";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TransitionCue from "./TransitionCue";
import ExplanationPanel from "./ExplanationPanel";
import Header from "./Header";
import { motion, AnimatePresence } from "framer-motion";

export default function Chat() {
  const { state, dispatch } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const welcomeSentRef = useRef(false);
  const [showHero, setShowHero] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (welcomeSentRef.current) return;
    welcomeSentRef.current = true;

    setTimeout(() => {
      setShowHero(false);
    }, 600);

    const welcomeMsg = generateWelcomeMessage();

    setTimeout(() => {
      const typingMsg = {
        ...welcomeMsg,
        text: "",
        isTyping: true,
      };
      dispatch({ type: "ADD_MESSAGE", message: typingMsg });

      setTimeout(() => {
        dispatch({
          type: "UPDATE_MESSAGE",
          id: welcomeMsg.id,
          updates: { text: welcomeMsg.text, isTyping: false },
        });
      }, 1600);
    }, 800);
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timer);
  }, [state.messages, state.showTransitionCue, state.explanationVisible, scrollToBottom]);

  const hasMessages = state.messages.length > 0;

  return (
    <div className="flex flex-col h-[100dvh] bg-surface-50">
      <Header />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin pt-16 sm:pt-20 pb-2"
      >
        <div className="max-w-2xl mx-auto px-3 sm:px-4">
          <AnimatePresence>
            {showHero && !hasMessages && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-center py-12"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-clyde-400 to-clyde-600 flex items-center justify-center mb-6 shadow-lg shadow-clyde-200"
                >
                  <span className="text-white text-2xl sm:text-3xl font-bold">C</span>
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-2xl sm:text-3xl font-semibold text-surface-800 mb-3"
                >
                  Meet Clyde
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-surface-500 text-sm sm:text-base max-w-sm leading-relaxed"
                >
                  Learn how to use AI — not through lectures, but by doing real
                  things you already care about.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 pb-2">
            {state.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>

          <TransitionCue />
          <ExplanationPanel />

          <div className="h-2" />
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
