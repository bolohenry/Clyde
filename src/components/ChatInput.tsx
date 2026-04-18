"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { useChatContext } from "@/context/ChatContext";
import { motion } from "framer-motion";

// Minimal type for Web Speech API (not fully covered in lib.dom.d.ts for webkit)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
  content: string; // extracted text, max 8 000 chars
}

// ─── file helpers ─────────────────────────────────────────────────────────────

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) ?? "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // Dynamic import keeps pdfjs-dist out of the main bundle
  const pdfjsLib = await import("pdfjs-dist");
  // Load the matching worker from unpkg — avoids copying the worker file locally
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? (item as { str: string }).str : ""))
      .join(" ");
    pages.push(pageText);
  }
  return pages.join("\n\n");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "application/pdf") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    );
  }
  if (type === "text/csv" || type.includes("csv")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M3 15h18M9 3v18"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ChatInput() {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { sendMessage, state, pendingInput, setPendingInput } = useChatContext();

  const isWaitingForResponse = state.messages.some((m) => m.isTyping);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    setSpeechSupported(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  // Populate textarea when an example is clicked in WhatElseCanAI
  useEffect(() => {
    if (!pendingInput) return;
    setText(pendingInput);
    setPendingInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
      inputRef.current.focus();
    }
  }, [pendingInput, setPendingInput]);

  useEffect(() => {
    if (inputRef.current && !isWaitingForResponse) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [state.messages.length, isWaitingForResponse]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const resizeTextarea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  // ── attachment handlers ───────────────────────────────────────────────────

  const handleImageAttach = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImage(e.target?.result as string);
      setAttachedFile(null);
      setFileError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleAttachment = async (file: File) => {
    setFileError(null);

    // Images → vision preview
    if (file.type.startsWith("image/")) {
      handleImageAttach(file);
      return;
    }

    // Validate file type
    const isSupported =
      file.type === "application/pdf" ||
      file.type.startsWith("text/") ||
      file.type === "application/json" ||
      /\.(txt|csv|md|json|py|js|ts|jsx|tsx|html|css|yaml|yml|xml|sh|r|rb|go|java|c|cpp|cs)$/i.test(file.name);

    if (!isSupported) {
      setFileError("Unsupported file type. Try a PDF, text file, CSV, or code file.");
      return;
    }

    setAttachedImage(null);
    setAttachedFile(null);
    setFileLoading(true);

    try {
      let content: string;
      if (file.type === "application/pdf") {
        content = await extractPDFText(file);
      } else {
        content = await readFileAsText(file);
      }

      if (!content.trim()) {
        setFileError("Couldn't extract any text from that file.");
        return;
      }

      setAttachedFile({
        name: file.name,
        type: file.type,
        size: file.size,
        content: content.trim().slice(0, 8000),
      });
    } catch {
      setFileError("Failed to read the file. Make sure it isn't password-protected.");
    } finally {
      setFileLoading(false);
    }
  };

  // ── submit ────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachedImage && !attachedFile) || isWaitingForResponse || fileLoading) return;
    recognitionRef.current?.stop();

    if (attachedImage) {
      sendMessage(trimmed, attachedImage);
    } else if (attachedFile) {
      sendMessage(trimmed, undefined, attachedFile.content, attachedFile.name);
    } else {
      sendMessage(trimmed);
    }

    setText("");
    setAttachedImage(null);
    setAttachedFile(null);
    setFileError(null);
    if (inputRef.current) inputRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => resizeTextarea();

  // ── speech ────────────────────────────────────────────────────────────────

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setTimeout(resizeTextarea, 10);
    };
    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
      setTimeout(resizeTextarea, 10);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // ── placeholder ───────────────────────────────────────────────────────────

  const placeholderText = () => {
    if (isListening) return "Listening...";
    if (fileLoading) return "Reading file...";
    if (isWaitingForResponse) return "Clyde is thinking...";
    if (attachedFile) return `Ask me anything about ${attachedFile.name}...`;
    switch (state.phase) {
      case "welcome":      return "Tell me what you have going on...";
      case "conversation": return "Keep going — I'm listening...";
      case "transition":
      case "structured":   return "Say more, or pick an option above...";
      case "explanation":  return "Type to continue, or explore above...";
      case "flexible":     return "What else can I help with?";
      default:             return "Type a message...";
    }
  };

  const canSubmit = (!!text.trim() || !!attachedImage || !!attachedFile) && !isWaitingForResponse && !fileLoading;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex-shrink-0 bg-gradient-to-t from-[var(--surface-page)] via-[var(--surface-page)]/95
        to-transparent pt-3 pb-safe px-3 sm:px-4 transition-colors duration-200"
    >
      <div className="max-w-2xl mx-auto">
        <div
          className={`flex flex-col bg-[var(--surface-card)] rounded-2xl border shadow-sm
            px-3 sm:px-4 py-2.5 transition-all duration-200
            ${isListening
              ? "border-clyde-400 dark:border-clyde-600 shadow-md"
              : isWaitingForResponse
              ? "border-[var(--surface-border)] opacity-75"
              : "border-[var(--surface-border)] focus-within:border-clyde-300 dark:focus-within:border-clyde-700 focus-within:shadow-md"
            }`}
        >
          {/* ── Image preview ── */}
          {attachedImage && (
            <div className="flex items-center gap-2 w-full pb-2 border-b border-[var(--surface-border)] mb-1">
              <div className="relative flex-shrink-0">
                <img
                  src={attachedImage}
                  alt="Attached"
                  className="w-12 h-12 rounded-lg object-cover border border-[var(--surface-border)]"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-surface-600 text-white
                    flex items-center justify-center text-[10px] hover:bg-surface-800 transition-colors"
                  aria-label="Remove image"
                >
                  ×
                </button>
              </div>
              <span className="text-[11px] text-surface-500 dark:text-surface-400">Image attached</span>
            </div>
          )}

          {/* ── File preview ── */}
          {(attachedFile || fileLoading) && (
            <div className="flex items-center gap-2 w-full pb-2 border-b border-[var(--surface-border)] mb-1">
              {fileLoading ? (
                <div className="flex items-center gap-2 text-[11px] text-surface-500 dark:text-surface-400">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-clyde-400 border-t-transparent rounded-full flex-shrink-0"
                  />
                  Reading file…
                </div>
              ) : attachedFile ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg
                    bg-clyde-50 dark:bg-clyde-950/40 border border-clyde-200 dark:border-clyde-800/50
                    flex items-center justify-center text-clyde-600 dark:text-clyde-400">
                    <FileTypeIcon type={attachedFile.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-surface-700 dark:text-surface-200 truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[10px] text-surface-400 dark:text-surface-500">
                      {formatBytes(attachedFile.size)} · {attachedFile.content.length.toLocaleString()} chars extracted
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setAttachedFile(null); setFileError(null); }}
                    className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-200 dark:bg-surface-700
                      text-surface-500 dark:text-surface-400 flex items-center justify-center
                      text-[11px] hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* ── File error ── */}
          {fileError && (
            <p className="text-[11px] text-red-500 dark:text-red-400 pb-1.5 -mt-0.5">
              {fileError}
            </p>
          )}

          {/* ── Input row ── */}
          <div className="flex items-center gap-2 w-full">
            {/* Paperclip / file attach */}
            <label
              htmlFor="file-upload"
              aria-label="Attach file"
              title="Attach image, PDF, or text file"
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                transition-all duration-150 cursor-pointer
                ${(attachedFile || attachedImage)
                  ? "text-clyde-500 dark:text-clyde-400"
                  : "text-surface-400 dark:text-surface-500 hover:text-clyde-500 dark:hover:text-clyde-400"
                }
                hover:bg-clyde-50 dark:hover:bg-clyde-950/40`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
              <input
                id="file-upload"
                type="file"
                accept="image/*,application/pdf,.txt,.csv,.md,.json,.py,.js,.ts,.jsx,.tsx,.html,.css,.yaml,.yml"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAttachment(file);
                  e.target.value = "";
                }}
              />
            </label>

            {/* Mic button */}
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={isWaitingForResponse}
                aria-label={isListening ? "Stop listening" : "Speak your message"}
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
                  transition-all duration-150 disabled:opacity-30
                  ${isListening
                    ? "bg-red-500 text-white"
                    : "text-surface-400 dark:text-surface-500 hover:text-clyde-500 dark:hover:text-clyde-400 hover:bg-clyde-50 dark:hover:bg-clyde-950/40"
                  }`}
              >
                {isListening ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </motion.div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            )}

            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onPaste={(e) => {
                const items = e.clipboardData?.items;
                if (!items) return;
                for (const item of Array.from(items)) {
                  if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (file) handleAttachment(file);
                    return;
                  }
                }
              }}
              placeholder={placeholderText()}
              disabled={isWaitingForResponse || fileLoading}
              rows={1}
              aria-label="Message to Clyde"
              className="flex-1 resize-none text-[15px] sm:text-sm text-surface-800 dark:text-surface-100
                placeholder-surface-500 dark:placeholder-surface-400
                bg-transparent outline-none leading-relaxed max-h-[120px] disabled:opacity-50"
            />

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              aria-label="Send message"
              className="flex-shrink-0 w-11 h-11 rounded-full bg-clyde-500 text-white
                flex items-center justify-center hover:bg-clyde-600 active:scale-95
                disabled:opacity-25 disabled:hover:bg-clyde-500 transition-all duration-150"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-center text-[11px] sm:text-xs text-surface-500 dark:text-surface-400 mt-1.5 sm:mt-2">
          Clyde helps you learn AI by doing real things — no experience needed
        </p>
      </div>
    </motion.div>
  );
}
