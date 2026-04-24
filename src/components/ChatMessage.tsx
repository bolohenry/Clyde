"use client";

import { Message } from "@/types";
import { motion } from "framer-motion";
import TypingIndicator from "./TypingIndicator";
import ActionChips from "./ActionChips";
import StructuredOutput from "./StructuredOutput";
import ClydeAvatar from "./ClydeAvatar";
import { useChatContext } from "@/context/ChatContext";
import { useTTS } from "@/hooks/useTTS";

const ERROR_LABELS: Record<NonNullable<Message["errorCode"]>, string> = {
  rate_limit: "Rate limit hit — wait a moment then retry.",
  llm_error: "Something went wrong. Try again?",
  network: "Network error. Check your connection.",
  no_api_key: "API key not configured.",
};

interface ChatMessageProps {
  message: Message;
}

function getClydeExpression(phase: string, isTyping?: boolean): "neutral" | "thinking" | "happy" | "excited" {
  if (isTyping) return "thinking";
  if (phase === "structured" || phase === "explanation") return "happy";
  if (phase === "flexible") return "excited";
  return "neutral";
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isClyde = message.role === "clyde";
  const { state, retryLastMessage } = useChatContext();
  const expression = getClydeExpression(state.phase, message.isTyping);
  const { speak, isActive, isGenerating, kokoroStatus, kokoroProgress } = useTTS(message.id);

  const canSpeak = isClyde && !message.isTyping && !message.isError
    && !message.isDivider && !message.isInsight && !!message.text;

  if (message.isDivider) {
    return (
      <div className="flex items-center gap-3 py-1 my-1">
        <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
        <span className="text-[11px] text-surface-400 dark:text-surface-500 flex-shrink-0">new topic</span>
        <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
      </div>
    );
  }

  if (message.isInsight) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-2 py-2 px-2"
      >
        <div className="flex items-center gap-2 w-full max-w-sm">
          <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400 flex-shrink-0">
            Notice something?
          </span>
          <div className="h-px flex-1 bg-surface-200 dark:bg-surface-700" />
        </div>
        <p className="text-[13px] text-center text-surface-500 dark:text-surface-400 leading-relaxed max-w-xs">
          {message.text}
        </p>
      </motion.div>
    );
  }

  if (message.isError) {
    const label = message.errorCode ? ERROR_LABELS[message.errorCode] : "Something went wrong.";
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-end gap-2 sm:gap-2.5"
      >
        <ClydeAvatar size="sm" expression="neutral" />
        <div className="relative max-w-[82%] sm:max-w-[78%]">
          <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 shadow-sm">
            <p className="text-[14px] sm:text-sm text-red-700 dark:text-red-400">{label}</p>
            {message.errorCode !== "no_api_key" && (
              <button
                onClick={retryLastMessage}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-[12px] font-medium text-red-700 dark:text-red-400
                  bg-white dark:bg-surface-800 border border-red-200 dark:border-red-900/60
                  hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300
                  active:scale-95 transition-all duration-150 min-h-[36px]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                </svg>
                Retry
              </button>
            )}
          </div>
          <SpeechTail side="left" variant="error" />
        </div>
      </motion.div>
    );
  }

  if (message.isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-end gap-2 sm:gap-2.5"
      >
        <ClydeAvatar size="sm" expression="thinking" />
        <div className="relative">
          <div className="bg-[var(--surface-card)] rounded-2xl rounded-bl-md border border-[var(--surface-border)] shadow-sm">
            <TypingIndicator />
          </div>
          <SpeechTail side="left" />
        </div>
      </motion.div>
    );
  }

  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => {
      const boldParts = line.split(/(\*\*[^*]+\*\*)/g);
      const rendered = boldParts.map((part, j) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={j} className="font-semibold text-surface-800 dark:text-surface-100">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={j}>{part}</span>;
      });
      return (
        <span key={i}>
          {i > 0 && <br />}
          {rendered}
        </span>
      );
    });
  };

  const isWelcome = message.id === "welcome-msg";

  return (
    <motion.div
      initial={isWelcome ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isClyde ? (
        <>
          <div className="flex items-end gap-2 sm:gap-2.5">
            {/* Avatar — tap to speak / stop */}
            <button
              onClick={canSpeak ? () => speak(message.text) : undefined}
              disabled={!canSpeak}
              aria-label={isActive ? "Stop" : "Listen to this message"}
              className={`relative flex-shrink-0 rounded-full transition-all duration-150
                ${canSpeak ? "cursor-pointer" : "cursor-default"}
                ${isActive ? "ring-2 ring-clyde-400 dark:ring-clyde-500 ring-offset-1 ring-offset-[var(--surface-page)]" : ""}
              `}
            >
              {/* Pulse ring while playing */}
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full ring-2 ring-clyde-400 dark:ring-clyde-500"
                  animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                />
              )}
              {/* Spinner overlay while Kokoro generates */}
              {isGenerating && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-clyde-400 border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                />
              )}
              <ClydeAvatar size="sm" expression={expression} animate={!isWelcome} />
            </button>
            <div className="relative max-w-[82%] sm:max-w-[78%]">
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--surface-card)] border border-[var(--surface-border)] shadow-sm">
                <span className="text-[15px] sm:text-sm leading-relaxed text-surface-700 dark:text-surface-200">
                  {renderText(message.text)}
                </span>
              </div>
              <SpeechTail side="left" />
            </div>
          </div>
          {canSpeak && (
            <button
              onClick={() => speak(message.text)}
              aria-label={isActive ? "Stop speaking" : "Hear this message"}
              className={`mt-2 ml-11 sm:ml-[52px] inline-flex items-center gap-1.5
                px-3 py-1 rounded-full text-[12px] font-medium border
                transition-all duration-150 active:scale-95
                ${isActive
                  ? "text-clyde-600 dark:text-clyde-400 bg-clyde-50 dark:bg-clyde-950/40 border-clyde-200 dark:border-clyde-800"
                  : "text-surface-500 dark:text-surface-400 bg-[var(--surface-card-alt)] border-[var(--surface-border)] hover:border-clyde-300 dark:hover:border-clyde-700 hover:text-clyde-600 dark:hover:text-clyde-300"
                }`}
            >
              {isGenerating ? (
                <>
                  <motion.span
                    className="w-2.5 h-2.5 rounded-full border-[1.5px] border-current border-t-transparent flex-shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                  />
                  {kokoroStatus === "loading" && kokoroProgress > 0
                    ? `Loading voice… ${kokoroProgress}%`
                    : "Generating…"}
                </>
              ) : isActive ? (
                <>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                  </svg>
                  Stop
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  </svg>
                  Hear this
                </>
              )}
            </button>
          )}

          {!message.isTyping && !message.isError && message.searchQuery && (
            <a
              href={`https://google.com/search?q=${encodeURIComponent(message.searchQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 ml-11 sm:ml-[52px] px-3 py-1.5 rounded-full
                text-[12px] font-medium border transition-all duration-150 group
                text-surface-600 dark:text-surface-300 bg-[var(--surface-card-alt)]
                border-[var(--surface-border)] hover:border-clyde-300 dark:hover:border-clyde-700
                hover:text-clyde-700 dark:hover:text-clyde-300 hover:bg-clyde-50 dark:hover:bg-clyde-950/40"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              {message.searchQuery}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-50 group-hover:opacity-100">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}

        </>
      ) : (
        <div className="flex flex-col items-end gap-1.5">
          {/* File attachment badge */}
          {message.attachedFileName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
              bg-clyde-600/90 text-white/90 text-[11px] font-medium max-w-[82%] sm:max-w-[78%]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="truncate">{message.attachedFileName}</span>
            </div>
          )}
          {/* Image attachment */}
          {message.imageUrl && (
            <div className="max-w-[82%] sm:max-w-[78%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt="Attached image"
                className="rounded-xl max-h-48 object-cover border border-clyde-400/40 shadow-sm"
              />
            </div>
          )}
          <div className="flex items-end gap-2 sm:gap-2.5 justify-end">
            <div className="relative max-w-[82%] sm:max-w-[78%]">
              <div className="px-4 py-3 rounded-2xl rounded-br-md bg-clyde-500 shadow-sm">
                <span className="text-[15px] sm:text-sm leading-relaxed text-white">
                  {message.text ? renderText(message.text) : (
                    <span className="italic opacity-75">
                      {message.attachedFileName ? "Attached a file" : "Attached an image"}
                    </span>
                  )}
                </span>
              </div>
              <SpeechTail side="right" />
            </div>
          </div>
        </div>
      )}

      {message.chips && message.chips.length > 0 && (
        <ActionChips chips={message.chips} />
      )}

      {message.structured && <StructuredOutput content={message.structured} />}
    </motion.div>
  );
}

function SpeechTail({ side, variant }: { side: "left" | "right"; variant?: "error" }) {
  if (side === "left") {
    const fill = variant === "error" ? "var(--tw-bg-opacity, rgb(254 242 242))" : "var(--surface-card)";
    return (
      <svg
        className="absolute -bottom-[1px] -left-[6px] w-4 h-3 speech-tail-left"
        viewBox="0 0 16 12"
        fill="none"
      >
        <path
          d="M16 0 C16 0 8 0 4 4 C0 8 0 12 0 12 C0 12 4 8 8 6 C12 4 16 2 16 0Z"
          fill={variant === "error" ? "transparent" : "var(--surface-card)"}
          stroke={variant === "error" ? "transparent" : "var(--surface-border)"}
          strokeWidth="1"
        />
        <path
          d="M16 1 C16 1 9 1 5 4.5 C1.5 7.5 1 11 1 11 C1 11 4.5 7.5 8.5 5.5 C12.5 3.5 16 2 16 1Z"
          fill={variant === "error" ? "transparent" : "var(--surface-card)"}
        />
      </svg>
    );
  }

  return (
    <svg
      className="absolute -bottom-[1px] -right-[6px] w-4 h-3"
      viewBox="0 0 16 12"
      fill="none"
    >
      <path
        d="M0 0 C0 0 8 0 12 4 C16 8 16 12 16 12 C16 12 12 8 8 6 C4 4 0 2 0 0Z"
        fill="#0c87f0"
      />
    </svg>
  );
}
