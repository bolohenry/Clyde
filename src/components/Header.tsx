"use client";

import { useChatContext } from "@/context/ChatContext";
import { useDarkMode } from "@/context/DarkModeContext";
import { ConversationPhase } from "@/types";
import { motion } from "framer-motion";
import ClydeAvatar from "./ClydeAvatar";

const PROGRESS_STEPS = 4;

function phaseToProgress(phase: ConversationPhase): number {
  switch (phase) {
    case "welcome":
      return -1;
    case "conversation":
      return 0;
    case "transition":
    case "structured":
      return 1;
    case "learn":
    case "explanation":
      return 2;
    case "flexible":
      return 3;
    default:
      return 0;
  }
}

function phaseToExpression(phase: ConversationPhase): "neutral" | "thinking" | "happy" | "excited" {
  switch (phase) {
    case "structured":
    case "explanation":
      return "happy";
    case "flexible":
      return "excited";
    default:
      return "neutral";
  }
}

export default function Header() {
  const { state } = useChatContext();
  const { isDark, toggle } = useDarkMode();
  const showProgress = state.phase !== "welcome";
  const currentIndex = phaseToProgress(state.phase);
  const expression = phaseToExpression(state.phase);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1a1714]/92
      backdrop-blur-md border-b border-surface-100 dark:border-surface-800
      transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClydeAvatar size="sm" expression={expression} animate={false} />
          <span className="text-base sm:text-lg font-semibold text-surface-800 dark:text-surface-100 tracking-tight">
            Clyde
          </span>
        </div>

        <div className="flex items-center gap-3">
          {showProgress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-1"
              role="progressbar"
              aria-valuenow={currentIndex + 1}
              aria-valuemin={1}
              aria-valuemax={PROGRESS_STEPS}
              aria-label="Conversation progress"
            >
              {Array.from({ length: PROGRESS_STEPS }).map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i <= currentIndex ? 20 : 8,
                    backgroundColor: i <= currentIndex
                      ? (isDark ? "#36a5ff" : "#0c87f0")
                      : (isDark ? "#44403c" : "#e7e5e4"),
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="h-1.5 rounded-full"
                />
              ))}
            </motion.div>
          )}

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-full
              text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300
              hover:bg-surface-100 dark:hover:bg-surface-700
              transition-all duration-150"
          >
            {isDark ? (
              /* Sun icon */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              /* Moon icon */
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
