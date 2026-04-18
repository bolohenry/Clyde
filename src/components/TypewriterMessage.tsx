"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ClydeAvatar from "./ClydeAvatar";

interface TypewriterMessageProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export default function TypewriterMessage({
  text,
  speed = 30,
  onComplete,
}: TypewriterMessageProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");
    setIsComplete(false);

    if (!text) return;

    intervalRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayedText(text.slice(0, indexRef.current));
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed]);

  const handleSkip = () => {
    if (isComplete) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText(text);
    setIsComplete(true);
    onCompleteRef.current?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onClick={handleSkip}
      className="flex items-end gap-2 sm:gap-2.5 cursor-pointer"
    >
      <ClydeAvatar size="sm" expression="neutral" />
      <div className="relative max-w-[82%] sm:max-w-[78%]">
        <div
          className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--surface-card)]
            border border-[var(--surface-border)] shadow-sm"
          role="status"
          aria-label="Clyde is typing a message"
        >
          <span className="text-[15px] sm:text-sm leading-relaxed text-surface-700 dark:text-surface-200">
            {displayedText}
            {!isComplete && (
              <span
                className="inline-block w-0.5 h-4 bg-clyde-400 dark:bg-clyde-500 ml-0.5 animate-pulse align-text-bottom"
                aria-hidden="true"
              />
            )}
          </span>
        </div>
        {/* Speech tail */}
        <svg
          className="absolute -bottom-[1px] -left-[6px] w-4 h-3"
          viewBox="0 0 16 12"
          fill="none"
        >
          <path
            d="M16 0 C16 0 8 0 4 4 C0 8 0 12 0 12 C0 12 4 8 8 6 C12 4 16 2 16 0Z"
            fill="var(--surface-card)"
            stroke="var(--surface-border)"
            strokeWidth="1"
          />
          <path
            d="M16 1 C16 1 9 1 5 4.5 C1.5 7.5 1 11 1 11 C1 11 4.5 7.5 8.5 5.5 C12.5 3.5 16 2 16 1Z"
            fill="var(--surface-card)"
          />
        </svg>
      </div>
    </motion.div>
  );
}
