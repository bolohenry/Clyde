"use client";

import { ChatProvider } from "@/context/ChatContext";
import Chat from "@/components/Chat";

export default function Home() {
  return (
    <ChatProvider>
      <main className="h-screen bg-surface-50">
        <Chat />
      </main>
    </ChatProvider>
  );
}
