"use client";

import { useChatContext } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import TypingIndicator from "./TypingIndicator";

export default function ExplanationPanel() {
  const { state, dispatch } = useChatContext();
  const { explanationContent, explanationLoading } = state;

  if (!state.explanationVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="explanation-panel"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="ml-11 sm:ml-[52px] mt-2 mr-1 sm:mr-4"
      >
        <div className="rounded-xl border border-[var(--surface-border)] bg-[var(--surface-card-alt)] px-4 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-clyde-600 dark:text-clyde-400">
              💡 How Clyde did that
            </span>
            <button
              onClick={() => dispatch({ type: "SHOW_EXPLANATION", show: false })}
              className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300
                transition-colors duration-150 -mr-0.5"
              aria-label="Dismiss explanation"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {explanationLoading && !explanationContent ? (
            <TypingIndicator />
          ) : (
            <p className="text-[13px] sm:text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              {explanationContent}
              {explanationLoading && (
                <span className="inline-block w-0.5 h-4 bg-clyde-400 ml-0.5 animate-pulse align-text-bottom" />
              )}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
