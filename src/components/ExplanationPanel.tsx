"use client";

import { useChatContext } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";
import { SuggestionType } from "@/types";
import WhatElseCanAI from "./WhatElseCanAI";

const USE_CASE_LABELS: Record<SuggestionType, string> = {
  plan: "Plan",
  prioritize: "Prioritize",
  todo: "To-do list",
  compare: "Compare",
  draft: "Draft",
  breakdown: "Break down",
  organize: "Organize",
  decide: "Decide",
  "next-steps": "Next steps",
};

const ALL_USE_CASES: SuggestionType[] = [
  "plan", "todo", "draft", "compare", "prioritize",
  "breakdown", "organize", "decide", "next-steps",
];

export default function ExplanationPanel() {
  const { state, tryAnotherUseCase } = useChatContext();

  if (!state.explanationVisible) return null;

  const contexts = state.userContext;
  const action = state.selectedAction || "plan";
  const tried = state.triedUseCases;

  const sections = [
    {
      icon: "👀",
      title: "What I noticed",
      body: (
        <>
          From your messages, I picked up on{" "}
          {contexts.length > 0 ? (
            contexts.slice(0, 3).map((c, i) => (
              <span key={c}>
                {i > 0 && i < Math.min(contexts.length, 3) - 1 && ", "}
                {i > 0 && i === Math.min(contexts.length, 3) - 1 && " and "}
                <span className="font-medium text-clyde-600 dark:text-clyde-400">{c}</span>
              </span>
            ))
          ) : (
            "what you had going on"
          )}
          . That context helped me figure out how to be useful.
        </>
      ),
    },
    {
      icon: "🎯",
      title: `Why I suggested a ${action}`,
      body: `Based on what you described, turning it into a ${action} seemed like the most practical next step. AI is really good at taking fuzzy thoughts and organizing them into something clear and actionable.`,
    },
    {
      icon: "⚡",
      title: "The key insight",
      body: "You didn't need to write a perfect prompt. You described your day in normal words, and AI turned that into something useful. That's the whole trick — start with real context, and let AI structure it.",
    },
    {
      icon: "🚀",
      title: "What to try next",
      body: "Now that you've seen this in action, try it with something else. AI can help with drafting messages, comparing options, making decisions, breaking down problems — pretty much any thinking task.",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-lg mt-4 mb-4"
      >
        <div className="rounded-2xl bg-[var(--surface-card)] border border-[var(--surface-border)] overflow-hidden shadow-sm">
          <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-clyde-500 to-clyde-600">
            <h3 className="text-white font-semibold text-base">How Clyde did that</h3>
            <p className="text-clyde-100 text-sm mt-0.5">A peek behind the curtain</p>
          </div>

          <div className="px-5 sm:px-6 py-5 space-y-5">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1, duration: 0.3 }}
                className="space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{section.icon}</span>
                  <h4 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
                    {section.title}
                  </h4>
                </div>
                <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed ml-7">
                  {section.body}
                </p>
              </motion.div>
            ))}

            {/* Use case progress tracker */}
            {tried.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="pt-1 border-t border-[var(--surface-border)]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-600 mb-2">
                  What you&apos;ve tried
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_USE_CASES.map((uc) => {
                    const done = tried.includes(uc);
                    return (
                      <span
                        key={uc}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors
                          ${done
                            ? "bg-clyde-50 dark:bg-clyde-950/60 border-clyde-200 dark:border-clyde-800/50 text-clyde-700 dark:text-clyde-300"
                            : "bg-[var(--surface-card-alt)] border-[var(--surface-border)] text-surface-400 dark:text-surface-600"
                          }`}
                      >
                        {done && (
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {USE_CASE_LABELS[uc]}
                      </span>
                    );
                  })}
                </div>
                {tried.length >= 3 && (
                  <p className="text-[11px] text-surface-400 dark:text-surface-600 mt-2">
                    You&apos;re building a real AI habit. Most people never get this far.
                  </p>
                )}
              </motion.div>
            )}

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: tried.length > 0 ? 0.75 : 0.65, duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={tryAnotherUseCase}
              className="w-full mt-1 px-4 py-3 rounded-xl bg-clyde-500 text-white
                text-sm font-semibold hover:bg-clyde-600 active:bg-clyde-700
                transition-colors duration-150 flex items-center justify-center gap-2"
            >
              <span aria-hidden="true">✨</span>
              Try another use case
            </motion.button>
          </div>
        </div>

        {/* What else can AI do — available after first flow */}
        <WhatElseCanAI />
      </motion.div>
    </AnimatePresence>
  );
}
