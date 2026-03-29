"use client";

import { useChatContext } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";

export default function TransitionCue() {
  const { state, showExplanation, tryAnotherUseCase } = useChatContext();

  if (!state.showTransitionCue) return null;

  const isPostStructured =
    state.phase === "structured" || state.phase === "transition";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-md mt-5 sm:mt-6 mb-3 sm:mb-4 px-1"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl animate-pulse-glow pointer-events-none" />
          <div className="relative bg-white rounded-2xl border border-clyde-200/80 p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-sm">
            <p className="text-[13px] sm:text-sm text-surface-600 text-center leading-relaxed">
              {isPostStructured
                ? "You just used AI to turn a messy thought into something useful."
                : "You're getting the hang of this."}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={showExplanation}
                className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-clyde-50 border border-clyde-200
                  text-[13px] sm:text-sm font-medium text-clyde-700 hover:bg-clyde-100
                  active:bg-clyde-150 transition-colors duration-150
                  flex items-center justify-center gap-2"
              >
                <span className="text-base sm:text-lg">💡</span>
                See how Clyde did that
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={tryAnotherUseCase}
                className="flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white border border-surface-200
                  text-[13px] sm:text-sm font-medium text-surface-600 hover:bg-surface-50
                  hover:border-surface-300 active:bg-surface-100
                  transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <span className="text-base sm:text-lg">✨</span>
                Try something else
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
