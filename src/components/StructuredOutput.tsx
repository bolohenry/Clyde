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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="mt-3 ml-12 mr-4 rounded-xl border border-surface-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="px-5 py-3 bg-surface-50 border-b border-surface-200">
        <h3 className="text-sm font-semibold text-surface-700">
          {content.title}
        </h3>
      </div>

      <div className="px-5 py-4 space-y-3">
        {content.type === "checklist" &&
          content.items.map((item) => (
            <label
              key={item.id}
              className="flex items-start gap-3 cursor-pointer group"
            >
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checkedItems.has(item.id)}
                  onChange={() => toggleCheck(item.id)}
                  className="w-4.5 h-4.5 rounded border-surface-300 text-clyde-500
                    focus:ring-clyde-400 focus:ring-offset-0 cursor-pointer"
                />
              </div>
              <span
                className={`text-sm leading-relaxed transition-all duration-200 ${
                  checkedItems.has(item.id)
                    ? "line-through text-surface-400"
                    : "text-surface-700 group-hover:text-surface-900"
                }`}
              >
                {item.text}
              </span>
            </label>
          ))}

        {(content.type === "plan" || content.type === "breakdown") &&
          content.items.map((item, i) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-clyde-100 text-clyde-600 text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm font-medium text-surface-800">
                  {item.text}
                </span>
              </div>
              {item.subItems && (
                <ul className="ml-8 space-y-1">
                  {item.subItems.map((sub, j) => (
                    <li
                      key={j}
                      className="text-sm text-surface-500 flex items-start gap-2"
                    >
                      <span className="text-surface-300 mt-1.5 flex-shrink-0">
                        ·
                      </span>
                      {sub}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

        {content.type === "comparison" &&
          content.items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-surface-50 border border-surface-100"
            >
              <h4 className="text-sm font-semibold text-surface-800 mb-2">
                {item.text}
              </h4>
              {item.subItems && (
                <ul className="space-y-1">
                  {item.subItems.map((sub, j) => {
                    const isPro = sub.toLowerCase().startsWith("pro:");
                    const isCon = sub.toLowerCase().startsWith("con:");
                    return (
                      <li
                        key={j}
                        className={`text-sm flex items-start gap-2 ${
                          isPro
                            ? "text-green-700"
                            : isCon
                            ? "text-red-600"
                            : "text-surface-600"
                        }`}
                      >
                        <span className="flex-shrink-0 mt-0.5">
                          {isPro ? "✓" : isCon ? "✗" : "·"}
                        </span>
                        {sub}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}

        {content.type === "draft" &&
          content.items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-lg bg-surface-50 border border-surface-100"
            >
              <p className="text-sm text-surface-700 whitespace-pre-line leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
      </div>
    </motion.div>
  );
}
