"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3" aria-hidden="true">
      <div
        className="w-2 h-2 rounded-full bg-surface-400 animate-typing-dot"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-surface-400 animate-typing-dot"
        style={{ animationDelay: "200ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-surface-400 animate-typing-dot"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );
}
