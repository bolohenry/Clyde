"use client";

import { StructuredContent } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";

interface StructuredOutputProps {
  content: StructuredContent;
}

function getPlainText(content: StructuredContent): string {
  const lines = [content.title, ""];
  content.items.forEach((item, i) => {
    if (content.type === "checklist") {
      lines.push(`☐ ${item.text}`);
    } else if (content.type === "plan" || content.type === "breakdown") {
      lines.push(`${i + 1}. ${item.text}`);
      item.subItems?.forEach((s) => lines.push(`   • ${s}`));
    } else if (content.type === "comparison") {
      lines.push(`${item.text}`);
      item.subItems?.forEach((s) => lines.push(`  ${s}`));
    } else {
      lines.push(item.text);
    }
  });
  return lines.join("\n");
}

export default function StructuredOutput({ content }: StructuredOutputProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const handleCopy = useCallback(async () => {
    const text = getPlainText(content);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 2000);
  }, [content]);

  const handleShare = useCallback(async () => {
    const text = getPlainText(content);
    if (navigator.share) {
      try {
        await navigator.share({ title: content.title, text });
        return;
      } catch {
        // fall through to copy
      }
    }
    handleCopy();
  }, [content, handleCopy]);

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="mt-3 ml-11 sm:ml-[52px] mr-1 sm:mr-4 rounded-xl
        border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm overflow-hidden"
    >
      {/* Card header */}
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-[var(--surface-card-alt)] border-b border-[var(--surface-border)] flex items-center justify-between gap-2">
        <h3 className="text-[13px] sm:text-sm font-semibold text-surface-700 dark:text-surface-200 flex-1 min-w-0 truncate">
          {content.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {typeof navigator !== "undefined" && typeof navigator.share === "function" ? (
            <button
              onClick={handleShare}
              aria-label="Share"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
                text-surface-500 dark:text-surface-400
                hover:text-surface-700 dark:hover:text-surface-200
                hover:bg-[var(--surface-border)] transition-all duration-150 min-h-[36px]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share
            </button>
          ) : null}
          <button
            onClick={handleCopy}
            aria-label={copyState === "copied" ? "Copied!" : "Copy to clipboard"}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
              transition-all duration-150 min-h-[36px]
              ${copyState === "copied"
                ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40"
                : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-[var(--surface-border)]"
              }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copyState === "copied" ? (
                <motion.svg key="check" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                  <path d="M20 6L9 17l-5-5"/>
                </motion.svg>
              ) : (
                <motion.svg key="copy" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </motion.svg>
              )}
            </AnimatePresence>
            {copyState === "copied" ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-3 sm:py-4 space-y-2.5 sm:space-y-3">
        {content.type === "checklist" &&
          content.items.map((item, i) => (
            <motion.label
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
              className="flex items-start gap-2.5 sm:gap-3 cursor-pointer group"
            >
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checkedItems.has(item.id)}
                  onChange={() => toggleCheck(item.id)}
                  className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-clyde-500
                    focus:ring-clyde-400 focus:ring-offset-0 cursor-pointer accent-clyde-500"
                />
              </div>
              <span
                className={`text-[13px] sm:text-sm leading-relaxed transition-all duration-200 ${
                  checkedItems.has(item.id)
                    ? "line-through text-surface-500 dark:text-surface-400"
                    : "text-surface-700 dark:text-surface-200 group-hover:text-surface-900 dark:group-hover:text-surface-100"
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
              transition={{ delay: 0.12 + i * 0.07 }}
              className="space-y-1.5"
            >
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded-full
                  bg-clyde-100 dark:bg-clyde-900/60 text-clyde-600 dark:text-clyde-300
                  text-[10px] sm:text-xs font-semibold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[13px] sm:text-sm font-medium text-surface-800 dark:text-surface-100 leading-snug">
                  {item.text}
                </span>
              </div>
              {item.subItems && (
                <ul className="ml-7 sm:ml-8 space-y-0.5 sm:space-y-1">
                  {item.subItems.map((sub, j) => (
                    <li
                      key={j}
                      className="text-[12px] sm:text-sm text-surface-500 dark:text-surface-400 flex items-start gap-1.5 sm:gap-2"
                    >
                      <span className="text-surface-400 dark:text-surface-500 mt-1 flex-shrink-0 text-[10px]">●</span>
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
              transition={{ delay: 0.12 + i * 0.08 }}
              className="p-3 rounded-lg bg-[var(--surface-card-alt)] border border-[var(--surface-border)]"
            >
              <h4 className="text-[13px] sm:text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1.5 sm:mb-2">
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
                            ? "text-green-700 dark:text-green-400"
                            : isCon
                            ? "text-red-600 dark:text-red-400"
                            : "text-surface-600 dark:text-surface-300"
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
              transition={{ delay: 0.15 }}
              className="p-3 sm:p-4 rounded-lg bg-[var(--surface-card-alt)] border border-[var(--surface-border)]"
            >
              <p className="text-[13px] sm:text-sm text-surface-700 dark:text-surface-200 whitespace-pre-line leading-relaxed">
                {item.text}
              </p>
            </motion.div>
          ))}
      </div>
    </motion.div>
  );
}
