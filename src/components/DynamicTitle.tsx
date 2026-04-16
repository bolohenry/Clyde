"use client";

import { useEffect } from "react";
import { useChatContext } from "@/context/ChatContext";

const PHASE_TITLES: Record<string, string> = {
  welcome: "Clyde — Learn AI by doing real things",
  conversation: "Talking with Clyde...",
  transition: "You just used AI ✨",
  structured: "Clyde made something for you",
  explanation: "How Clyde works",
  flexible: "Keep going with Clyde",
  learn: "Learning with Clyde",
};

export default function DynamicTitle() {
  const { state } = useChatContext();

  useEffect(() => {
    const title = PHASE_TITLES[state.phase] ?? "Clyde";
    document.title = title;
  }, [state.phase]);

  return null;
}
