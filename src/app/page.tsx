"use client";

import { MotionConfig } from "framer-motion";
import { ChatProvider } from "@/context/ChatContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import Chat from "@/components/Chat";
import DynamicTitle from "@/components/DynamicTitle";

export default function Home() {
  return (
    <DarkModeProvider>
      <MotionConfig reducedMotion="user">
        <ChatProvider>
          <DynamicTitle />
          <main className="h-screen bg-[var(--surface-page)]">
            <Chat />
          </main>
        </ChatProvider>
      </MotionConfig>
    </DarkModeProvider>
  );
}
