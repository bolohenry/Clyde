"use client";

import { Message } from "@/types";
import { motion } from "framer-motion";
import TypingIndicator from "./TypingIndicator";
import ActionChips from "./ActionChips";
import StructuredOutput from "./StructuredOutput";
import ClydeAvatar from "./ClydeAvatar";
import { useChatContext } from "@/context/ChatContext";

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
  const { state } = useChatContext();
  const expression = getClydeExpression(state.phase, message.isTyping);

  if (message.isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end gap-2 sm:gap-2.5"
      >
        <ClydeAvatar size="sm" expression="thinking" />
        <div className="relative">
          <div className="bg-white dark:bg-surface-800 rounded-2xl rounded-bl-md border border-surface-200 dark:border-surface-700 shadow-sm">
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
      initial={isWelcome ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {isClyde ? (
        <div className="flex items-end gap-2 sm:gap-2.5">
          <ClydeAvatar size="sm" expression={expression} animate={!isWelcome} />
          <div className="relative max-w-[82%] sm:max-w-[78%]">
            <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm">
              <span className="text-[15px] sm:text-sm leading-relaxed text-surface-700 dark:text-surface-200">
                {renderText(message.text)}
              </span>
            </div>
            <SpeechTail side="left" />
          </div>
        </div>
      ) : (
        <div className="flex items-end gap-2 sm:gap-2.5 justify-end">
          <div className="relative max-w-[82%] sm:max-w-[78%]">
            <div className="px-4 py-3 rounded-2xl rounded-br-md bg-clyde-500 shadow-sm">
              <span className="text-[15px] sm:text-sm leading-relaxed text-white">
                {renderText(message.text)}
              </span>
            </div>
            <SpeechTail side="right" />
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

function SpeechTail({ side }: { side: "left" | "right" }) {
  if (side === "left") {
    return (
      <svg
        className="absolute -bottom-[1px] -left-[6px] w-4 h-3 speech-tail-left"
        viewBox="0 0 16 12"
        fill="none"
      >
        <path
          d="M16 0 C16 0 8 0 4 4 C0 8 0 12 0 12 C0 12 4 8 8 6 C12 4 16 2 16 0Z"
          className="fill-white dark:fill-surface-800"
        />
        <path
          d="M16 0 C16 0 8 0 4 4 C0 8 0 12 0 12 C0 12 4 8 8 6 C12 4 16 2 16 0Z"
          stroke="#e7e5e4"
          strokeWidth="1"
          fill="none"
          clipPath="inset(0 0 0 0)"
          className="dark:stroke-surface-700"
        />
        <path
          d="M16 1 C16 1 9 1 5 4.5 C1.5 7.5 1 11 1 11 C1 11 4.5 7.5 8.5 5.5 C12.5 3.5 16 2 16 1Z"
          className="fill-white dark:fill-surface-800"
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
