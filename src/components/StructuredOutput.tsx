"use client";

import { StructuredContent, StructuredItem } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { parseResponse } from "@/engine/parser";
import { track } from "@/lib/analytics";
import { jsPDF } from "jspdf";

interface StructuredOutputProps {
  content: StructuredContent;
}

function getPlainText(content: StructuredContent, editedTexts: Record<string, string>): string {
  const lines = [content.title, ""];
  content.items.forEach((item, i) => {
    const text = editedTexts[item.id] ?? item.text;
    if (content.type === "checklist") {
      lines.push(`☐ ${text}`);
    } else if (content.type === "plan" || content.type === "breakdown") {
      lines.push(`${i + 1}. ${text}`);
      item.subItems?.forEach((s) => lines.push(`   • ${s}`));
    } else if (content.type === "comparison") {
      lines.push(text);
      item.subItems?.forEach((s) => lines.push(`  ${s}`));
    } else {
      lines.push(text);
    }
  });
  return lines.join("\n");
}

function EditableText({
  item,
  className,
  editedTexts,
  onEdit,
}: {
  item: StructuredItem;
  className: string;
  editedTexts: Record<string, string>;
  onEdit: (id: string, val: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const value = editedTexts[item.id] ?? item.text;

  return (
    <span
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        setFocused(false);
        onEdit(item.id, e.currentTarget.textContent ?? "");
      }}
      className={`${className} outline-none rounded px-0.5 -mx-0.5
        ${focused ? "ring-1 ring-clyde-300 dark:ring-clyde-700 bg-clyde-50/50 dark:bg-clyde-950/30" : "hover:bg-surface-100 dark:hover:bg-surface-800/50"}
        cursor-text transition-all duration-100`}
      title="Click to edit"
      role="textbox"
      aria-label="Edit item"
    >
      {value}
    </span>
  );
}

export default function StructuredOutput({ content }: StructuredOutputProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
  const [refineText, setRefineText] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refinedContent, setRefinedContent] = useState<StructuredContent | null>(null);
  const [shareState, setShareState] = useState<"idle" | "sharing" | "copied">("idle");

  const displayContent = refinedContent ?? content;

  const handleEdit = useCallback((id: string, val: string) => {
    setEditedTexts((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleCopy = useCallback(async () => {
    track("output_copied", { type: content.type });
    const text = getPlainText(displayContent, editedTexts);
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
  }, [displayContent, editedTexts, content.type]);

  const handleShare = useCallback(async () => {
    track("output_shared", { type: content.type });
    setShareState("sharing");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: refinedContent ?? content }),
      });
      const { id } = await res.json();
      const url = `${window.location.origin}/s/${id}`;
      if (typeof navigator.share === "function") {
        await navigator.share({ title: content.title, url });
      } else {
        await navigator.clipboard.writeText(url).catch(() => {});
      }
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
    } catch {
      setShareState("idle");
    }
  }, [content, refinedContent, editedTexts]);

  const handleDownloadPDF = useCallback(() => {
    track("output_downloaded_pdf", { type: content.type });
    const doc = new jsPDF();
    const margin = 20;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const maxW = pageW - margin * 2;
    let y = margin + 5;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(displayContent.title, maxW);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 9 + 6;

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    displayContent.items.forEach((item, i) => {
      const text = editedTexts[item.id] ?? item.text;

      if (displayContent.type === "checklist") {
        const lines = doc.splitTextToSize(`\u2610  ${text}`, maxW);
        if (y + lines.length * 7 > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(lines, margin, y);
        y += lines.length * 7 + 4;

      } else if (displayContent.type === "plan" || displayContent.type === "breakdown") {
        doc.setFont("helvetica", "bold");
        const lines = doc.splitTextToSize(`${i + 1}.  ${text}`, maxW - 5);
        if (y + lines.length * 7 > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(lines, margin, y);
        y += lines.length * 7 + 3;

        if (item.subItems?.length) {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          item.subItems.forEach((sub) => {
            const subLines = doc.splitTextToSize(`\u2022  ${sub}`, maxW - 12);
            if (y + subLines.length * 6 > pageH - margin) { doc.addPage(); y = margin; }
            doc.text(subLines, margin + 8, y);
            y += subLines.length * 6 + 2;
          });
          doc.setTextColor(60, 60, 60);
          y += 2;
        }

      } else if (displayContent.type === "comparison") {
        doc.setFont("helvetica", "bold");
        const lines = doc.splitTextToSize(text, maxW);
        if (y + lines.length * 7 > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(lines, margin, y);
        y += lines.length * 7 + 2;

        if (item.subItems?.length) {
          doc.setFont("helvetica", "normal");
          item.subItems.forEach((sub) => {
            const isPro = sub.toLowerCase().startsWith("pro:");
            const isCon = sub.toLowerCase().startsWith("con:");
            if (isPro) doc.setTextColor(20, 120, 60);
            else if (isCon) doc.setTextColor(180, 40, 40);
            else doc.setTextColor(80, 80, 80);
            const prefix = isPro ? "\u2713  " : isCon ? "\u2717  " : "\u00B7  ";
            const subLines = doc.splitTextToSize(prefix + sub, maxW - 8);
            if (y + subLines.length * 6 > pageH - margin) { doc.addPage(); y = margin; }
            doc.text(subLines, margin + 6, y);
            y += subLines.length * 6 + 2;
          });
          doc.setTextColor(60, 60, 60);
          y += 4;
        }

      } else {
        // draft
        const lines = doc.splitTextToSize(text, maxW);
        if (y + lines.length * 7 > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(lines, margin, y);
        y += lines.length * 7 + 4;
      }
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Generated by Clyde \u00B7 clyde.app", margin, pageH - 10);

    const fileName =
      displayContent.title.replace(/[^a-z0-9\s]/gi, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 40) + ".pdf";
    doc.save(fileName);
  }, [displayContent, editedTexts, content.type]);

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
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22, delay: 0.1 }}
      className="mt-3 ml-11 sm:ml-[52px] mr-1 sm:mr-4 rounded-xl
        border border-[var(--surface-border)] bg-[var(--surface-card)] shadow-sm overflow-hidden"
    >
      {/* Card header */}
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-clyde-50 dark:bg-clyde-950/40 border-b border-clyde-100 dark:border-clyde-900/50 flex items-center justify-between gap-2">
        <h3 className="text-[13px] sm:text-sm font-semibold text-clyde-800 dark:text-clyde-200 flex-1 min-w-0 truncate">
          <span className="mr-1.5" aria-hidden="true">
            {displayContent.type === "checklist" ? "✅" :
             displayContent.type === "plan" ? "📋" :
             displayContent.type === "comparison" ? "⚖️" :
             displayContent.type === "draft" ? "✏️" : "📋"}
          </span>
          {displayContent.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleDownloadPDF}
            aria-label="Download as PDF"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
              transition-all duration-150 min-h-[36px]
              text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-[var(--surface-border)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            PDF
          </button>
          <button
            onClick={handleShare}
            aria-label="Share"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] font-medium
              transition-all duration-150 min-h-[36px]
              ${shareState === "copied"
                ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40"
                : "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-[var(--surface-border)]"
              }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            {shareState === "sharing" ? "Sharing..." : shareState === "copied" ? "Copied link!" : "Share"}
          </button>
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
        {displayContent.type === "checklist" &&
          displayContent.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
              className="flex items-start gap-2.5 sm:gap-3 group"
            >
              <div className="mt-0.5 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={checkedItems.has(item.id)}
                  onChange={() => toggleCheck(item.id)}
                  className="w-4 h-4 rounded border-surface-300 dark:border-surface-600 text-clyde-500
                    focus:ring-clyde-400 focus:ring-offset-0 cursor-pointer accent-clyde-500"
                  aria-label={`Mark "${editedTexts[item.id] ?? item.text}" as done`}
                />
              </div>
              <EditableText
                item={item}
                editedTexts={editedTexts}
                onEdit={handleEdit}
                className={`text-[13px] sm:text-sm leading-relaxed transition-all duration-200 ${
                  checkedItems.has(item.id)
                    ? "line-through text-surface-500 dark:text-surface-400"
                    : "text-surface-700 dark:text-surface-200"
                }`}
              />
            </motion.div>
          ))}

        {(displayContent.type === "plan" || displayContent.type === "breakdown") &&
          displayContent.items.map((item, i) => (
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
                <EditableText
                  item={item}
                  editedTexts={editedTexts}
                  onEdit={handleEdit}
                  className="text-[13px] sm:text-sm font-medium text-surface-800 dark:text-surface-100 leading-snug"
                />
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

        {displayContent.type === "comparison" &&
          displayContent.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.08 }}
              className="p-3 rounded-lg bg-[var(--surface-card-alt)] border border-[var(--surface-border)]"
            >
              <h4 className="text-[13px] sm:text-sm font-semibold text-surface-800 dark:text-surface-100 mb-1.5 sm:mb-2">
                {editedTexts[item.id] ?? item.text}
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

        {displayContent.type === "draft" &&
          displayContent.items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="p-3 sm:p-4 rounded-lg bg-[var(--surface-card-alt)] border border-[var(--surface-border)]"
            >
              <p
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleEdit(item.id, e.currentTarget.textContent ?? "")}
                className="text-[13px] sm:text-sm text-surface-700 dark:text-surface-200
                  whitespace-pre-line leading-relaxed outline-none
                  hover:bg-surface-100 dark:hover:bg-surface-800/50
                  focus:ring-1 focus:ring-clyde-300 dark:focus:ring-clyde-700 rounded
                  cursor-text transition-all duration-100"
                title="Click to edit"
                role="textbox"
                aria-label="Edit draft"
              >
                {item.text}
              </p>
            </motion.div>
          ))}
      </div>

      {/* Refine section */}
      <div className="px-4 sm:px-5 pb-3 pt-1 border-t border-[var(--surface-border)] mt-1">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!refineText.trim() || isRefining) return;
            setIsRefining(true);
            try {
              const currentOutput = getPlainText(content, editedTexts);
              const res = await fetch("/api/refine", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentOutput, refinementRequest: refineText.trim() }),
              });
              if (!res.body) return;
              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let accumulated = "";
              let buffer = "";
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const raw = line.slice(6).trim();
                  try {
                    const event = JSON.parse(raw);
                    if (event.type === "delta") accumulated += event.text;
                  } catch { continue; }
                }
              }
              const parsed = parseResponse(accumulated);
              if (parsed.structured) setRefinedContent(parsed.structured);
              setRefineText("");
            } catch { /* silent fail */ } finally {
              setIsRefining(false);
            }
          }}
          className="flex items-center gap-2 mt-2"
        >
          <input
            type="text"
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder={isRefining ? "Refining..." : "Refine this... (e.g. make it shorter)"}
            disabled={isRefining}
            className="flex-1 text-[12px] sm:text-[13px] px-3 py-2 rounded-lg border border-[var(--surface-border)]
              bg-[var(--surface-card-alt)] text-surface-700 dark:text-surface-200
              placeholder-surface-400 dark:placeholder-surface-500
              outline-none focus:border-clyde-300 dark:focus:border-clyde-700
              disabled:opacity-50 transition-colors duration-150 min-h-[36px]"
          />
          <button
            type="submit"
            disabled={!refineText.trim() || isRefining}
            className="flex-shrink-0 px-3 py-2 rounded-lg bg-clyde-500 text-white text-[12px] font-medium
              hover:bg-clyde-600 disabled:opacity-30 transition-all duration-150 min-h-[36px]"
          >
            {isRefining ? "..." : "Refine"}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
