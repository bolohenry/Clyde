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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-md mt-6 mb-4"
      >
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
          <div className="relative bg-white rounded-2xl border border-clyde-200 p-5 space-y-4">
            <p className="text-sm text-surface-600 text-center">
              {isPostStructured
                ? "You just used AI to turn a messy thought into something useful."
                : "You're getting the hang of this."}
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={showExplanation}
                className="flex-1 px-4 py-3 rounded-xl bg-clyde-50 border border-clyde-200
                  text-sm font-medium text-clyde-700 hover:bg-clyde-100
                  transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <span className="text-lg">💡</span>
                See how Clyde did that
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={tryAnotherUseCase}
                className="flex-1 px-4 py-3 rounded-xl bg-white border border-surface-200
                  text-sm font-medium text-surface-600 hover:bg-surface-50 hover:border-surface-300
                  transition-colors duration-150 flex items-center justify-center gap-2"
              >
                <span className="text-lg">✨</span>
                Try something else
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
