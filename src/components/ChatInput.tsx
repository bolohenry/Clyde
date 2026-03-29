"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useChatContext } from "@/context/ChatContext";
import { motion } from "framer-motion";

export default function ChatInput() {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, state } = useChatContext();

  const isWaitingForResponse = state.messages.some((m) => m.isTyping);

  useEffect(() => {
    if (inputRef.current && !isWaitingForResponse) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [state.messages.length, isWaitingForResponse]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isWaitingForResponse) return;
    sendMessage(trimmed);
    setText("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const placeholderText = () => {
    if (isWaitingForResponse) return "Clyde is thinking...";
    switch (state.phase) {
      case "welcome":
        return "Tell me what you have going on...";
      case "conversation":
        return "Keep going — I'm listening...";
      case "transition":
        return "Say more, or pick an option above...";
      case "flexible":
        return "What else can I help with?";
      default:
        return "Type a message...";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex-shrink-0 bg-gradient-to-t from-surface-50 via-surface-50/95 to-surface-50/0 pt-3 pb-3 sm:pb-4 px-3 sm:px-4"
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`flex items-end gap-2 bg-white rounded-2xl border shadow-sm
            px-3 sm:px-4 py-2 sm:py-2.5 transition-all duration-200
            ${
              isWaitingForResponse
                ? "border-surface-200 opacity-75"
                : "border-surface-200 focus-within:border-clyde-300 focus-within:shadow-md"
            }`}
        >
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={placeholderText()}
            disabled={isWaitingForResponse}
            rows={1}
            className="flex-1 resize-none text-[15px] sm:text-sm text-surface-800 placeholder-surface-400
              bg-transparent outline-none leading-relaxed max-h-[120px] disabled:opacity-50
              py-0.5"
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isWaitingForResponse}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-clyde-500 text-white
              flex items-center justify-center hover:bg-clyde-600 active:scale-95
              disabled:opacity-25 disabled:hover:bg-clyde-500 transition-all duration-150"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[11px] sm:text-xs text-surface-400 mt-1.5 sm:mt-2">
          Clyde helps you learn AI by doing real things — no experience needed
        </p>
      </div>
    </motion.div>
  );
}
