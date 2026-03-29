"use client";

import { motion } from "framer-motion";

type ClydeExpression = "neutral" | "thinking" | "happy" | "excited";

interface ClydeAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  expression?: ClydeExpression;
  animate?: boolean;
}

const sizes = {
  sm: { container: "w-9 h-9", face: 36, scale: 0.36 },
  md: { container: "w-12 h-12", face: 48, scale: 0.48 },
  lg: { container: "w-24 h-24", face: 96, scale: 0.96 },
  xl: { container: "w-32 h-32", face: 128, scale: 1.28 },
};

export default function ClydeAvatar({
  size = "sm",
  expression = "neutral",
  animate = true,
}: ClydeAvatarProps) {
  const s = sizes[size];
  const Wrapper = animate ? motion.div : "div";

  return (
    <Wrapper
      {...(animate
        ? {
            initial: { scale: 0.9, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: { duration: 0.3, ease: "easeOut" },
          }
        : {})}
      className={`${s.container} flex-shrink-0`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Head */}
        <circle cx="50" cy="50" r="46" fill="#4A9FE8" />
        <circle cx="50" cy="50" r="42" fill="#5BB0F5" />

        {/* Subtle highlight on forehead */}
        <ellipse cx="42" cy="32" rx="18" ry="10" fill="#6EBCFA" opacity="0.5" />

        {/* Eyes */}
        <Eyes expression={expression} />

        {/* Mouth */}
        <Mouth expression={expression} />

        {/* Cheeks — gentle blush */}
        <circle cx="28" cy="58" r="6" fill="#FF9EBF" opacity="0.2" />
        <circle cx="72" cy="58" r="6" fill="#FF9EBF" opacity="0.2" />
      </svg>
    </Wrapper>
  );
}

function Eyes({ expression }: { expression: ClydeExpression }) {
  if (expression === "thinking") {
    return (
      <>
        {/* Left eye — looking up-right */}
        <ellipse cx="37" cy="46" rx="6" ry="7" fill="white" />
        <circle cx="39" cy="44" r="3.5" fill="#2D3748" />
        <circle cx="40" cy="43" r="1.2" fill="white" />
        {/* Right eye — looking up-right */}
        <ellipse cx="63" cy="46" rx="6" ry="7" fill="white" />
        <circle cx="65" cy="44" r="3.5" fill="#2D3748" />
        <circle cx="66" cy="43" r="1.2" fill="white" />
      </>
    );
  }

  if (expression === "happy" || expression === "excited") {
    return (
      <>
        {/* Left eye — happy squint */}
        <ellipse cx="37" cy="46" rx="6" ry="7" fill="white" />
        <circle cx="37" cy="47" r="3.5" fill="#2D3748" />
        <circle cx="38.5" cy="45.5" r="1.3" fill="white" />
        {/* Right eye — happy squint */}
        <ellipse cx="63" cy="46" rx="6" ry="7" fill="white" />
        <circle cx="63" cy="47" r="3.5" fill="#2D3748" />
        <circle cx="64.5" cy="45.5" r="1.3" fill="white" />
        {/* Slightly raised brows for excitement */}
        {expression === "excited" && (
          <>
            <path d="M30 38 Q37 34 44 38" stroke="#3B7BC0" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M56 38 Q63 34 70 38" stroke="#3B7BC0" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        )}
      </>
    );
  }

  // Neutral
  return (
    <>
      {/* Left eye */}
      <ellipse cx="37" cy="46" rx="6" ry="7" fill="white" />
      <circle cx="37" cy="47" r="3.5" fill="#2D3748" />
      <circle cx="38.5" cy="45.5" r="1.2" fill="white" />
      {/* Right eye */}
      <ellipse cx="63" cy="46" rx="6" ry="7" fill="white" />
      <circle cx="63" cy="47" r="3.5" fill="#2D3748" />
      <circle cx="64.5" cy="45.5" r="1.2" fill="white" />
    </>
  );
}

function Mouth({ expression }: { expression: ClydeExpression }) {
  if (expression === "thinking") {
    return (
      <ellipse cx="50" cy="66" rx="4" ry="3.5" fill="#3B7BC0" opacity="0.7" />
    );
  }

  if (expression === "excited") {
    return (
      <path
        d="M38 62 Q50 76 62 62"
        stroke="#3B7BC0"
        strokeWidth="2.5"
        fill="#3B7BC0"
        opacity="0.7"
        strokeLinecap="round"
      />
    );
  }

  if (expression === "happy") {
    return (
      <path
        d="M39 63 Q50 73 61 63"
        stroke="#3B7BC0"
        strokeWidth="2.5"
        fill="none"
        opacity="0.7"
        strokeLinecap="round"
      />
    );
  }

  // Neutral — gentle smile
  return (
    <path
      d="M41 64 Q50 70 59 64"
      stroke="#3B7BC0"
      strokeWidth="2.5"
      fill="none"
      opacity="0.6"
      strokeLinecap="round"
    />
  );
}
