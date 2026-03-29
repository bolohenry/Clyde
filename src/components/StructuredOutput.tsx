"use client";

import { StructuredContent } from "@/types";
import { motion } from "framer-motion";
import { useState } from "react";

interface StructuredOutputProps {
  content: StructuredContent;
}

export default function StructuredOutput({ content }: StructuredOutputProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-3 ml-11 sm:ml-[52px] mr-1 sm:mr-4 rounded-xl border border-surface-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-surface-50/80 border-b border-surface-100">
        <h3 className="text-[13px] sm:text-sm font-semibold text-surface-700">
          {content.title}
        </h3>
      </div>

      <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
        {content.type === "checklist" &&
          content.items.map((item, i) => (
            <motion.label
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="flex items-start gap-2.5 sm:gap-3 cursor-pointer group"
            >
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checkedItems.has(item.id)}
                  onChange={() => toggleCheck(item.id)}
                  className="w-4 h-4 rounded border-surface-300 text-clyde-500
                    focus:ring-clyde-400 focus:ring-offset-0 cursor-pointer
                    accent-clyde-500"
                />
              </div>
              <span
                className={`text-[13px] sm:text-sm leading-relaxed transition-all duration-200 ${
                  checkedItems.has(item.id)
                    ? "line-through text-surface-400"
                    : "text-surface-700 group-hover:text-surface-900"
                }`}
              >
                {item.text}
              </span>
            </motion.label>
          ))}

        {(content.type === "plan" || content.type === "breakdown") &&
          content.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="space-y-1.5"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-clyde-100 text-clyde-600 text-[10px] sm:text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[13px] sm:text-sm font-medium text-surface-800 leading-snug">
                  {item.text}
                </span>
              </div>
              {item.subItems && (
                <ul className="ml-7 sm:ml-8 space-y-0.5 sm:space-y-1">
                  {item.subItems.map((sub, j) => (
                    <li
                      key={j}
                      className="text-[12px] sm:text-sm text-surface-500 flex items-start gap-1.5 sm:gap-2"
                    >
                      <span className="text-surface-300 mt-1 flex-shrink-0 text-[10px]">
                        ●
                      </span>
                      {sub}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}

        {content.type === "comparison" &&
          content.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="p-3 rounded-lg bg-surface-50 border border-surface-100"
            >
              <h4 className="text-[13px] sm:text-sm font-semibold text-surface-800 mb-1.5 sm:mb-2">
                {item.text}
              </h4>
              {item.subItems && (
                <ul className="space-y-0.5 sm:space-y-1">
                  {item.subItems.map((sub, j) => {
                    const isPro = sub.toLowerCase().startsWith("pro:");
                    const isCon = sub.toLowerCase().startsWith("con:");
                    return (
                      <li
                        key={j}
                        className={`text-[12px] sm:text-sm flex items-start gap-1.5 sm:gap-2 ${
                          isPro
                            ? "text-green-700"
                            : isCon
                            ? "text-red-600"
                            : "text-surface-600"
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5 text-xs">
                          {isPro ? "✓" : isCon ? "✗" : "·"}
                        </span>
                        <span>{sub}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          ))}

        {content.type === "draft" &&
          content.items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="p-3 sm:p-4 rounded-lg bg-surface-50 border border-surface-100"
            >
              <p className="text-[13px] sm:text-sm text-surface-700 whitespace-pre-line leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}
