"use client";

import { useChatContext } from "@/context/ChatContext";
import { motion } from "framer-motion";

const PHASE_ORDER = ["conversation", "structured", "learn", "flexible"] as const;

export default function Header() {
  const { state } = useChatContext();
  const showProgress = state.phase !== "welcome";
  const currentIndex = PHASE_ORDER.indexOf(
    state.phase as (typeof PHASE_ORDER)[number]
  );

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
          >
            {PHASE_ORDER.map((phase, i) => (
              <motion.div
                key={phase}
                animate={{
                  width: i <= Math.max(currentIndex, 0) ? 20 : 8,
                  backgroundColor:
                    i <= Math.max(currentIndex, 0) ? "#36a5ff" : "#e7e5e4",
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
