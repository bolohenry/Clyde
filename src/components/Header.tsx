"use client";

import { useChatContext } from "@/context/ChatContext";

export default function Header() {
  const { state } = useChatContext();
  const showProgress = state.phase !== "welcome";

  const phases = ["conversation", "structured", "learn", "flexible"];
  const currentIndex = phases.indexOf(state.phase);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-surface-200/50">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-clyde-500 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">C</span>
          </div>
          <span className="text-lg font-semibold text-surface-800">Clyde</span>
        </div>

        {showProgress && (
          <div className="flex items-center gap-1.5">
            {phases.map((phase, i) => (
              <div
                key={phase}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i <= currentIndex
                    ? "w-6 bg-clyde-400"
                    : "w-3 bg-surface-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
