"use client";

import { useChatContext } from "@/context/ChatContext";
import { ConversationPhase } from "@/types";
import { motion } from "framer-motion";

const PROGRESS_STEPS = 4;

function phaseToProgress(phase: ConversationPhase): number {
  switch (phase) {
    case "welcome":
      return -1;
    case "conversation":
      return 0;
    case "transition":
      return 1;
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

export default function Header() {
  const { state } = useChatContext();
  const showProgress = state.phase !== "welcome";
  const currentIndex = phaseToProgress(state.phase);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-surface-100">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-clyde-400 to-clyde-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs sm:text-sm font-bold">C</span>
          </div>
          <span className="text-base sm:text-lg font-semibold text-surface-800 tracking-tight">
            Clyde
          </span>
        </div>

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
                  backgroundColor:
                    i <= currentIndex ? "#36a5ff" : "#e7e5e4",
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="h-1.5 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </div>
    </header>
  );
}
