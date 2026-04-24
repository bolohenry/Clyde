"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useChatContext } from "@/context/ChatContext";
import { useDarkMode } from "@/context/DarkModeContext";
import { useAutoPlay } from "@/hooks/useAutoPlay";
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
  const { state, resetConversation } = useChatContext();
  const { isDark, toggle } = useDarkMode();
  const { autoPlay, toggle: toggleAutoPlay } = useAutoPlay();
  const [expression, setExpression] = useState<"neutral" | "thinking" | "happy" | "excited">(
    phaseToExpression(state.phase)
  );
  const prevPhaseRef = useRef(state.phase);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;

    if (prev !== "structured" && state.phase === "structured") {
      setExpression("excited");
      const t = setTimeout(() => setExpression("happy"), 2000);
      return () => clearTimeout(t);
    }

    if (state.phase !== "structured" && state.phase !== "explanation") {
      setExpression(phaseToExpression(state.phase));
    }
  }, [state.phase]);

  const hasStarted = state.phase !== "welcome" || state.messages.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#1a1714]
      backdrop-blur-md dark:backdrop-blur-none border-b border-surface-100 dark:border-surface-700
      transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full dark:bg-surface-700/60 dark:ring-1 dark:ring-surface-600/40 flex-shrink-0">
            <ClydeAvatar size="sm" expression={expression} animate={false} />
          </div>
          <span className="text-base sm:text-lg font-semibold text-surface-800 dark:text-surface-100 tracking-tight">
            Clyde
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/create"
            aria-label="Let me ask Clyde"
            title="Send someone a link to Clyde"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              text-surface-500 dark:text-surface-400
              hover:text-surface-700 dark:hover:text-surface-200
              hover:bg-surface-100 dark:hover:bg-surface-700
              transition-all duration-150"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Let me ask Clyde
          </Link>

          {hasStarted && (
            <button
              onClick={resetConversation}
              aria-label="Start over"
              title="Start over"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                text-surface-500 dark:text-surface-400
                hover:text-surface-700 dark:hover:text-surface-200
                hover:bg-surface-100 dark:hover:bg-surface-700
                transition-all duration-150"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Start over
            </button>
          )}

          <button
            onClick={toggleAutoPlay}
            aria-label={autoPlay ? "Auto-play on — tap to turn off" : "Auto-play off — tap to turn on"}
            title={autoPlay ? "Auto-play on" : "Auto-play off"}
            className={`w-8 h-8 flex items-center justify-center rounded-full
              transition-all duration-150
              ${autoPlay
                ? "text-clyde-500 dark:text-clyde-400 bg-clyde-50 dark:bg-clyde-950/40 hover:bg-clyde-100 dark:hover:bg-clyde-900/40"
                : "text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              }`}
          >
            {autoPlay ? (
              /* Speaker with waves — active */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            ) : (
              /* Speaker with X — muted */
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            )}
          </button>

          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-full
              text-surface-400 hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300
              hover:bg-surface-100 dark:hover:bg-surface-700
              transition-all duration-150"
          >
            {isDark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
