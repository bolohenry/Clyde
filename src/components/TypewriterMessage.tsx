"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

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

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");
    setIsComplete(false);

    if (!text) return;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current += 1;
        setDisplayedText(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-start gap-2.5 sm:gap-3"
    >
      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-clyde-400 to-clyde-600 flex items-center justify-center shadow-sm">
        <span className="text-white text-[10px] sm:text-xs font-bold" aria-hidden="true">C</span>
      </div>
      <div
        className="max-w-[85%] sm:max-w-[80%] px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tl-md bg-white border border-surface-200 shadow-sm"
        role="status"
        aria-label="Clyde is typing a message"
      >
        <span className="text-[15px] sm:text-sm leading-relaxed text-surface-700">
          {displayedText}
          {!isComplete && (
            <span
              className="inline-block w-0.5 h-4 bg-clyde-400 ml-0.5 animate-pulse align-text-bottom"
              aria-hidden="true"
            />
          )}
        </span>
      </div>
    </motion.div>
  );
}
