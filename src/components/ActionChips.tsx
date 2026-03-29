"use client";

import { ActionChip } from "@/types";
import { useChatContext } from "@/context/ChatContext";
import { motion } from "framer-motion";

interface ActionChipsProps {
  chips: ActionChip[];
}

export default function ActionChips({ chips }: ActionChipsProps) {
  const { selectChipAction } = useChatContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 ml-11 sm:ml-[52px]"
    >
      {chips.map((chip, i) => (
        <motion.button
          key={chip.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, delay: 0.2 + i * 0.08 }}
          onClick={() => selectChipAction(chip.type)}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full
            text-[13px] sm:text-sm font-medium text-clyde-700 bg-clyde-50 border border-clyde-200/70
            hover:bg-clyde-100 hover:border-clyde-300 hover:shadow-sm
            active:scale-95 transition-all duration-150 cursor-pointer"
        >
          {chip.icon && <span className="text-sm sm:text-base">{chip.icon}</span>}
          {chip.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
