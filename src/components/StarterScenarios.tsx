"use client";

import { motion } from "framer-motion";
import { useChatContext } from "@/context/ChatContext";

const SCENARIOS = [
  { label: "Busy week ahead", prompt: "I've got a really busy week and need help getting organized", icon: "📅" },
  { label: "Big decision", prompt: "I have a big decision to make and can't figure out what to do", icon: "🤔" },
  { label: "Planning a trip", prompt: "I'm planning a trip and have a lot to figure out", icon: "✈️" },
  { label: "Need to write something", prompt: "I need to write something but don't know where to start", icon: "✏️" },
  { label: "Work project", prompt: "I have a work project I need to break down into steps", icon: "💼" },
  { label: "Something on my mind", prompt: "I have something on my mind I need to think through", icon: "💭" },
];

export default function StarterScenarios() {
  const { setPendingInput } = useChatContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mt-4 ml-11 sm:ml-[52px]"
    >
      <p className="text-[11px] font-medium text-surface-500 dark:text-surface-400 mb-2 uppercase tracking-wide">
        Or pick something to start with
      </p>
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: 0.35 + i * 0.06 }}
            onClick={() => setPendingInput(s.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full
              text-[13px] font-medium border
              text-surface-600 dark:text-surface-300
              bg-[var(--surface-card)] border-[var(--surface-border)]
              hover:border-clyde-300 dark:hover:border-clyde-700
              hover:text-clyde-700 dark:hover:text-clyde-300
              hover:bg-clyde-50 dark:hover:bg-clyde-950/40
              active:scale-95 transition-all duration-150 min-h-[36px]"
          >
            <span>{s.icon}</span>
            {s.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
