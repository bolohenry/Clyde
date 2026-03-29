"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div
        className="w-2 h-2 rounded-full bg-clyde-400 animate-typing-dot"
        style={{ animationDelay: "0ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-clyde-400 animate-typing-dot"
        style={{ animationDelay: "200ms" }}
      />
      <div
        className="w-2 h-2 rounded-full bg-clyde-400 animate-typing-dot"
        style={{ animationDelay: "400ms" }}
      />
    </div>
  );
}
