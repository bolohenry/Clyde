"use client";

import { useChatContext } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import ContextualFollowUps from "./ContextualFollowUps";

export default function TransitionCue() {
  const { state, showExplanation, tryAnotherUseCase } = useChatContext();

  if (!state.showTransitionCue) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="transition-cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-3"
      >
        {/* Two quiet text links — no box, no fanfare */}
        <div className="ml-11 sm:ml-[52px] flex items-center gap-3 flex-wrap">
          {!state.explanationVisible && (
            <>
              <button
                onClick={showExplanation}
                className="text-[13px] text-clyde-600 dark:text-clyde-400
                  hover:text-clyde-700 dark:hover:text-clyde-300
                  flex items-center gap-1.5 transition-colors duration-150"
              >
                💡 How did Clyde do that?
              </button>
              <span className="text-surface-300 dark:text-surface-600 select-none">·</span>
            </>
          )}
          <button
            onClick={tryAnotherUseCase}
            className="text-[13px] text-surface-500 dark:text-surface-400
              hover:text-surface-700 dark:hover:text-surface-200
              flex items-center gap-1.5 transition-colors duration-150"
          >
            ✨ Try something else
          </button>
        </div>

        {/* Contextual follow-up chips — aligned with the output card */}
        <ContextualFollowUps />
      </motion.div>
    </AnimatePresence>
  );
}
