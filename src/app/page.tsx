"use client";

import { MotionConfig } from "framer-motion";
import { ChatProvider, useChatContext } from "@/context/ChatContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import Chat from "@/components/Chat";
import DynamicTitle from "@/components/DynamicTitle";

function InnerApp() {
  const { resetKey } = useChatContext();
  return (
    <main className="h-screen bg-[var(--surface-page)]">
      <Chat key={resetKey} />
    </main>
  );
}

export default function Home() {
  return (
    <DarkModeProvider>
      <MotionConfig reducedMotion="user">
        <ChatProvider>
          <DynamicTitle />
          <InnerApp />
        </ChatProvider>
      </MotionConfig>
    </DarkModeProvider>
  );
}
