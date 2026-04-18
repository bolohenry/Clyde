"use client";

export default function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 py-3.5"
      aria-hidden="true"
    >
      {[0, 180, 360].map((delay, i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-surface-300 dark:bg-surface-500 animate-typing-dot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
