"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatContext } from "@/context/ChatContext";

interface Example {
  label: string;
  prompt: string;
}

interface Category {
  icon: string;
  title: string;
  color: string;
  examples: Example[];
}

const CATEGORIES: Category[] = [
  {
    icon: "📋",
    title: "Organize & Plan",
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40",
    examples: [
      { label: "Plan my week", prompt: "Help me plan out my week — I've got a lot going on and need to figure out priorities." },
      { label: "Project plan", prompt: "I need a step-by-step plan for a project I'm working on." },
      { label: "Packing list", prompt: "I'm traveling soon and need help making a packing list." },
      { label: "Daily routine", prompt: "Help me build a better morning or evening routine." },
    ],
  },
  {
    icon: "✍️",
    title: "Draft & Write",
    color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40",
    examples: [
      { label: "Write an email", prompt: "I need to write an email but I'm not sure how to phrase it." },
      { label: "Text message", prompt: "Help me figure out what to say in a message to someone." },
      { label: "Intro or bio", prompt: "I need to write a short bio or introduction about myself." },
      { label: "Summarize something", prompt: "I have something long I need to summarize into key points." },
    ],
  },
  {
    icon: "⚖️",
    title: "Think & Decide",
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40",
    examples: [
      { label: "Compare two options", prompt: "I'm choosing between two options and need help thinking it through." },
      { label: "Pros and cons", prompt: "Help me think through the pros and cons of a decision I'm facing." },
      { label: "Should I do it?", prompt: "I'm on the fence about something and need a second opinion." },
      { label: "Prioritize my tasks", prompt: "I have a bunch of tasks and need help figuring out what to do first." },
    ],
  },
  {
    icon: "🔍",
    title: "Break It Down",
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40",
    examples: [
      { label: "Explain it simply", prompt: "Explain something to me like I'm new to it — I want to actually understand it." },
      { label: "Step-by-step guide", prompt: "I need a clear step-by-step guide for how to do something." },
      { label: "Break this down", prompt: "I have a big complicated thing and need help breaking it into pieces." },
      { label: "Next steps", prompt: "I'm stuck and not sure what to do next — help me figure out my next steps." },
    ],
  },
];

export default function WhatElseCanAI() {
  const [isOpen, setIsOpen] = useState(false);
  const { setPendingInput } = useChatContext();

  const handleExampleClick = (prompt: string) => {
    setPendingInput(prompt);
    setIsOpen(false);
    // Scroll to bottom so input is visible
    window.requestAnimationFrame(() => {
      document.querySelector("[aria-label='Message to Clyde']")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <div className="mx-auto max-w-lg mt-3 mb-2">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl
          bg-[var(--surface-card-alt)] border border-[var(--surface-border)]
          text-sm font-medium text-surface-600 dark:text-surface-300
          hover:bg-[var(--surface-border)] transition-colors duration-150"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">🤔</span>
          What else can AI do?
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9"/>
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.title}>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${cat.color}`}>
                    {cat.icon} {cat.title}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.examples.map((ex) => (
                      <button
                        key={ex.label}
                        onClick={() => handleExampleClick(ex.prompt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full
                          text-[12px] font-medium border transition-all duration-150
                          text-surface-600 dark:text-surface-300
                          bg-[var(--surface-card)] border-[var(--surface-border)]
                          hover:border-clyde-300 dark:hover:border-clyde-700
                          hover:text-clyde-700 dark:hover:text-clyde-300
                          hover:bg-clyde-50 dark:hover:bg-clyde-950/40
                          active:scale-95 min-h-[32px]"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
