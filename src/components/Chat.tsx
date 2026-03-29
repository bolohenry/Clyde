"use client";

import { useEffect, useRef, useCallback } from "react";
import { useChatContext } from "@/context/ChatContext";
import { generateWelcomeMessage } from "@/engine/responses";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TransitionCue from "./TransitionCue";
import ExplanationPanel from "./ExplanationPanel";
import Header from "./Header";

export default function Chat() {
  const { state, dispatch } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const welcomeSentRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (welcomeSentRef.current) return;
    welcomeSentRef.current = true;

    const welcomeMsg = generateWelcomeMessage();

    const typingMsg = {
      ...welcomeMsg,
      text: "",
      isTyping: true,
    };
    dispatch({ type: "ADD_MESSAGE", message: typingMsg });

    setTimeout(() => {
      dispatch({
        type: "UPDATE_MESSAGE",
        id: welcomeMsg.id,
        updates: { text: welcomeMsg.text, isTyping: false },
      });
    }, 1800);
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [state.messages, state.showTransitionCue, state.explanationVisible, scrollToBottom]);

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin pt-20 pb-4"
      >
        <div className="max-w-2xl mx-auto px-4">
          {state.messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-16 h-16 rounded-full bg-clyde-500 flex items-center justify-center mb-6">
                <span className="text-white text-2xl font-bold">C</span>
              </div>
              <h1 className="text-2xl font-semibold text-surface-800 mb-2">
                Meet Clyde
              </h1>
              <p className="text-surface-500 text-sm max-w-sm">
                Learn how to use AI — not through lectures, but by doing real
                things you already care about.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {state.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>

          <TransitionCue />
          <ExplanationPanel />
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
