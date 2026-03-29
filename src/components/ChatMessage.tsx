"use client";

import { Message } from "@/types";
import { motion } from "framer-motion";
import TypingIndicator from "./TypingIndicator";
import ActionChips from "./ActionChips";
import StructuredOutput from "./StructuredOutput";

interface ChatMessageProps {
  message: Message;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isClyde = message.role === "clyde";

  if (message.isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-2.5 sm:gap-3"
      >
        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-clyde-400 to-clyde-600 flex items-center justify-center shadow-sm">
          <span className="text-white text-[10px] sm:text-xs font-bold">C</span>
        </div>
        <div className="bg-white rounded-2xl rounded-tl-md border border-surface-200 shadow-sm">
          <TypingIndicator />
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
            <strong key={j} className="font-semibold text-surface-800">
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
      <div
        className={`flex items-start gap-2.5 sm:gap-3 ${
          isClyde ? "" : "flex-row-reverse"
        }`}
      >
        {isClyde && (
          <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-clyde-400 to-clyde-600 flex items-center justify-center shadow-sm">
            <span className="text-white text-[10px] sm:text-xs font-bold">C</span>
          </div>
        )}

        <div
          className={`max-w-[85%] sm:max-w-[80%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-[15px] sm:text-sm leading-relaxed ${
            isClyde
              ? "bg-white border border-surface-200 shadow-sm rounded-tl-md text-surface-700"
              : "bg-clyde-500 text-white rounded-tr-md shadow-sm"
          }`}
        >
          {renderText(message.text)}
        </div>
      </div>

      {message.chips && message.chips.length > 0 && (
        <ActionChips chips={message.chips} />
      )}

      {message.structured && <StructuredOutput content={message.structured} />}
    </motion.div>
  );
}
