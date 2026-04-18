"use client";

import { ChatProvider, useChatContext } from "@/context/ChatContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Chat from "@/components/Chat";

function InnerApp() {
  const { resetKey } = useChatContext();
  return (
    <main className="h-screen bg-surface-50 dark:bg-surface-900">
      <Chat key={resetKey} />
    </main>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <InnerApp />
      </ChatProvider>
    </ThemeProvider>
  );
}
