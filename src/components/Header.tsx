"use client";

import { useChatContext } from "@/context/ChatContext";
import { useTheme } from "@/context/ThemeContext";
import { ConversationPhase } from "@/types";
import ClydeAvatar from "./ClydeAvatar";

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
  const { state, reset } = useChatContext();
  const { isDark, toggleTheme } = useTheme();
  const expression = phaseToExpression(state.phase);
  const hasStarted = state.phase !== "welcome" || state.messages.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md border-b border-surface-100 dark:border-surface-700">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClydeAvatar size="sm" expression={expression} animate={false} />
          <span className="text-base sm:text-lg font-semibold text-surface-800 dark:text-surface-100 tracking-tight">
            Clyde
          </span>
        </div>

        <div className="flex items-center gap-1">
          {hasStarted && (
            <button
              onClick={reset}
              aria-label="Start over"
              title="Start over"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                text-surface-500 dark:text-surface-400
                hover:text-surface-700 dark:hover:text-surface-200
                hover:bg-surface-100 dark:hover:bg-surface-800
                transition-all duration-150"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Start over
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-surface-500 dark:text-surface-400
              hover:text-surface-700 dark:hover:text-surface-200
              hover:bg-surface-100 dark:hover:bg-surface-800
              transition-all duration-150"
          >
            {isDark ? (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
