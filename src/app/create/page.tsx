"use client";

import { useState } from "react";
import Link from "next/link";

const MAX_CHARS = 1500;
const APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://clyde.app";

export default function CreatePage() {
  const [text, setText] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = () => {
    if (!text.trim()) return;
    const encoded = encodeURIComponent(text.trim());
    setLink(`${window.location.origin}/?ask=${encoded}`);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = () => {
    setText("");
    setLink(null);
    setCopied(false);
  };

  const remaining = MAX_CHARS - text.length;
  const overLimit = remaining < 0;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <Link href="/" className="flex items-center gap-2 mb-10 group w-fit">
          <div className="w-8 h-8 rounded-full bg-[#0c87f0] flex items-center justify-center
            group-hover:bg-[#0a75d1] transition-colors">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-[#1c1917]">Clyde</span>
        </Link>

        {!link ? (
          <>
            <h1 className="text-2xl font-semibold text-[#1c1917] mb-1">
              Send someone to Clyde
            </h1>
            <p className="text-[#78716c] text-sm mb-6 leading-relaxed">
              Paste what they said. You&apos;ll get a link — they click it and
              Clyde is ready to help, with their message already loaded.
            </p>

            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste what they said..."
                rows={6}
                className="w-full resize-none rounded-xl border border-[#e7e5e4]
                  bg-white px-4 py-3.5 text-[15px] text-[#1c1917]
                  placeholder-[#a8a29e] outline-none leading-relaxed
                  focus:border-[#0c87f0] focus:ring-2 focus:ring-[#0c87f0]/10
                  transition-all duration-150"
              />
              <span
                className={`absolute bottom-3 right-3 text-[11px] tabular-nums
                  ${overLimit ? "text-red-500" : "text-[#a8a29e]"}`}
              >
                {remaining}
              </span>
            </div>

            <button
              onClick={handleCreate}
              disabled={!text.trim() || overLimit}
              className="mt-3 w-full py-3 rounded-xl bg-[#0c87f0] text-white
                font-semibold text-[15px] hover:bg-[#0a75d1] active:scale-[0.98]
                disabled:opacity-30 disabled:cursor-not-allowed
                transition-all duration-150"
            >
              Create link
            </button>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#1c1917] mb-1">
              Link ready
            </h1>
            <p className="text-[#78716c] text-sm mb-6 leading-relaxed">
              Send this to them. When they click it, Clyde opens with their
              message already in the box.
            </p>

            {/* Link box */}
            <div className="rounded-xl border border-[#e7e5e4] bg-white p-4 mb-3">
              <p className="text-[13px] text-[#78716c] break-all leading-relaxed select-all">
                {link}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className={`w-full py-3 rounded-xl font-semibold text-[15px]
                active:scale-[0.98] transition-all duration-150
                ${copied
                  ? "bg-green-500 text-white"
                  : "bg-[#0c87f0] text-white hover:bg-[#0a75d1]"
                }`}
            >
              {copied ? "✓ Copied" : "Copy link"}
            </button>

            <button
              onClick={handleReset}
              className="mt-3 w-full py-2.5 rounded-xl text-[14px] font-medium
                text-[#78716c] hover:text-[#1c1917] transition-colors duration-150"
            >
              Make another
            </button>
          </>
        )}

        {/* Footer */}
        <p className="mt-10 text-center text-[12px] text-[#a8a29e]">
          Links are instant — no account needed.{" "}
          <Link href="/" className="text-[#0c87f0] hover:underline underline-offset-2">
            Try Clyde yourself →
          </Link>
        </p>
      </div>
    </div>
  );
}
