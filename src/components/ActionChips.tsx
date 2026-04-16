"use client";

import { useRef, useState } from "react";
import { ActionChip } from "@/types";
import { useChatContext } from "@/context/ChatContext";
import { motion } from "framer-motion";

interface ActionChipsProps {
  chips: ActionChip[];
}

export default function ActionChips({ chips }: ActionChipsProps) {
  const { selectChipAction } = useChatContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (chip: ActionChip) => {
    if (selectedId) return;
    setSelectedId(chip.id);
    selectChipAction(chip.type);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (selectedId) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const buttons = containerRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])");
    if (!buttons || buttons.length === 0) return;
    const arr = Array.from(buttons);
    const next = e.key === "ArrowRight"
      ? arr[(index + 1) % arr.length]
      : arr[(index - 1 + arr.length) % arr.length];
    next?.focus();
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 ml-11 sm:ml-[52px]"
      role="group"
      aria-label="Quick actions"
    >
      {chips.map((chip, i) => {
        const isSelected = selectedId === chip.id;
        const isDisabled = selectedId !== null && !isSelected;
        return (
          <motion.button
            key={chip.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: isDisabled ? 0.35 : 1, scale: 1 }}
            transition={{ duration: 0.2, delay: selectedId ? 0 : 0.2 + i * 0.08 }}
            onClick={() => handleClick(chip)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={!!selectedId}
            aria-pressed={isSelected}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-full
              text-[13px] sm:text-sm font-medium border transition-all duration-150
              ${isSelected
                ? "text-white bg-clyde-500 border-clyde-500 shadow-sm"
                : `text-clyde-700 dark:text-clyde-300
                   bg-clyde-50 dark:bg-clyde-950/60
                   border-clyde-200/70 dark:border-clyde-800/50
                   hover:bg-clyde-100 dark:hover:bg-clyde-900/60
                   hover:border-clyde-300 dark:hover:border-clyde-700
                   hover:shadow-sm active:scale-95 cursor-pointer`
              }
              ${isDisabled ? "cursor-default" : ""}
            `}
          >
            {chip.icon && <span className="text-sm sm:text-base">{chip.icon}</span>}
            {chip.label}
            {isSelected && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-0.5">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
