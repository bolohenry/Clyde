"use client";

import { motion } from "framer-motion";

type ClydeExpression = "neutral" | "thinking" | "happy" | "excited";

interface ClydeAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  expression?: ClydeExpression;
  animate?: boolean;
}

const sizes = {
  sm: { container: "w-9 h-9" },
  md: { container: "w-12 h-12" },
  lg: { container: "w-24 h-24" },
  xl: { container: "w-32 h-32" },
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
        viewBox="0 0 100 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
        aria-hidden="true"
      >
        {/* ── SHOES ── */}
        <ellipse cx="34" cy="107" rx="11" ry="4" fill="#111827" />
        <ellipse cx="56" cy="107" rx="10" ry="4" fill="#111827" />

        {/* ── LEGS / TROUSERS ── short and stout */}
        <rect x="26" y="88" width="14" height="20" rx="4" fill="#1a2744" />
        <rect x="46" y="88" width="13" height="20" rx="4" fill="#1a2744" />

        {/* ── JACKET BODY — wide, rotund belly ── */}
        {/* Main mass */}
        <ellipse cx="44" cy="72" rx="30" ry="24" fill="#1a2744" />
        {/* Belly bulge */}
        <ellipse cx="42" cy="76" rx="22" ry="16" fill="#1f2f54" />
        {/* Bottom fill to trousers */}
        <rect x="14" y="82" width="60" height="10" rx="0" fill="#1a2744" />

        {/* ── LEFT ARM — hanging at side ── */}
        <path
          d="M16 64 Q10 75 10 87"
          stroke="#1a2744"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
        {/* Left shirt cuff */}
        <ellipse cx="10" cy="88" rx="5" ry="3.5" fill="#f2ede8" transform="rotate(10 10 88)" />
        {/* Left hand */}
        <ellipse cx="10" cy="91" rx="5" ry="4" fill="#f5c4a1" transform="rotate(10 10 91)" />

        {/* ── RIGHT ARM — raised, presenting gesture ── */}
        <path
          d="M70 60 Q80 44 84 24"
          stroke="#1a2744"
          strokeWidth="11"
          fill="none"
          strokeLinecap="round"
        />
        {/* Right shirt cuff */}
        <ellipse cx="84" cy="22" rx="5.5" ry="3.5" fill="#f2ede8" transform="rotate(-20 84 22)" />
        {/* Right hand — open, welcoming */}
        <ellipse cx="84" cy="18" rx="6" ry="5" fill="#f5c4a1" transform="rotate(-20 84 18)" />
        {/* Fingers suggestion */}
        <path d="M80 15 Q82 11 84 14" stroke="#e8ad8a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M83 13 Q85 9 87 12" stroke="#e8ad8a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M86 15 Q88 11 89 15" stroke="#e8ad8a" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* ── WHITE SHIRT FRONT ── */}
        <ellipse cx="44" cy="70" rx="7" ry="17" fill="#f2ede8" />
        {/* Shirt buttons */}
        <circle cx="44" cy="63" r="1.2" fill="#ccc8c2" />
        <circle cx="44" cy="70" r="1.2" fill="#ccc8c2" />
        <circle cx="44" cy="77" r="1.2" fill="#ccc8c2" />

        {/* ── LAPELS ── */}
        {/* Left lapel */}
        <path d="M37 57 L44 71 L37 83 L14 70 L14 57Z" fill="#1a2744" />
        {/* Right lapel */}
        <path d="M51 57 L44 71 L51 83 L74 70 L74 57Z" fill="#1a2744" />

        {/* Pocket square — right breast */}
        <path d="M60 58 L66 55 L68 59 L62 62Z" fill="white" opacity="0.6" />

        {/* Collar points */}
        <path d="M37 57 L44 54 L51 57" fill="white" />

        {/* ── BOW TIE ── */}
        <path d="M36 54 L44 57.5 L36 61Z" fill="#9b2335" />
        <path d="M52 54 L44 57.5 L52 61Z" fill="#9b2335" />
        <circle cx="44" cy="57.5" r="2.5" fill="#6d1a26" />

        {/* ── NECK ── */}
        <rect x="39" y="50" width="10" height="7" rx="2" fill="#e8ad8a" />

        {/* ── HEAD — round and jolly, slightly left of center ── */}
        <ellipse cx="48" cy="31" rx="24" ry="26" fill="#f5c4a1" />

        {/* Forehead highlight */}
        <ellipse cx="42" cy="20" rx="11" ry="7" fill="white" opacity="0.14" />

        {/* Rosy cheeks */}
        <circle cx="30" cy="37" r="7" fill="#e8909a" opacity="0.38" />
        <circle cx="66" cy="37" r="7" fill="#e8909a" opacity="0.38" />

        {/* ── EYEBROWS ── */}
        <Brows expression={expression} />

        {/* ── EYES ── */}
        <Eyes expression={expression} />

        {/* ── MUSTACHE ── distinguished, full */}
        <path
          d="M37 44 Q42 47 48 45 Q54 47 59 44"
          stroke="#7a5230"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />

        {/* ── MOUTH ── */}
        <Mouth expression={expression} />
      </svg>
    </Wrapper>
  );
}

/* ── Eyebrows ─────────────────────────────────── */
function Brows({ expression }: { expression: ClydeExpression }) {
  if (expression === "thinking") {
    return (
      <>
        <path d="M30 22 Q37 19 43 21" stroke="#7a5230" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M53 20 Q60 17 67 21" stroke="#7a5230" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (expression === "happy") {
    return (
      <>
        <path d="M30 21 Q37 17 43 20" stroke="#7a5230" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M53 20 Q60 17 67 21" stroke="#7a5230" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </>
    );
  }
  if (expression === "excited") {
    return (
      <>
        <path d="M29 19 Q37 14 43 18" stroke="#7a5230" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M53 18 Q61 14 68 19" stroke="#7a5230" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  // Neutral
  return (
    <>
      <path d="M30 23 Q37 20 43 22" stroke="#7a5230" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M53 22 Q60 20 67 23" stroke="#7a5230" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  );
}

/* ── Eyes ──────────────────────────────────────── */
function Eyes({ expression }: { expression: ClydeExpression }) {
  if (expression === "thinking") {
    return (
      <>
        <ellipse cx="37" cy="30" rx="5.5" ry="6" fill="white" />
        <circle cx="38.5" cy="28" r="3.2" fill="#3d2b1f" />
        <circle cx="39.5" cy="27" r="1.2" fill="white" />
        <ellipse cx="59" cy="30" rx="5.5" ry="6" fill="white" />
        <circle cx="60.5" cy="28" r="3.2" fill="#3d2b1f" />
        <circle cx="61.5" cy="27" r="1.2" fill="white" />
      </>
    );
  }

  if (expression === "happy") {
    return (
      <>
        <ellipse cx="37" cy="30" rx="6" ry="5" fill="white" />
        <circle cx="37" cy="31" r="3.2" fill="#3d2b1f" />
        <circle cx="38.5" cy="29.5" r="1.2" fill="white" />
        <path d="M31.5 28 Q37 25 42.5 28" stroke="#e8ad8a" strokeWidth="1.4" fill="none" />
        <ellipse cx="59" cy="30" rx="6" ry="5" fill="white" />
        <circle cx="59" cy="31" r="3.2" fill="#3d2b1f" />
        <circle cx="60.5" cy="29.5" r="1.2" fill="white" />
        <path d="M53.5 28 Q59 25 64.5 28" stroke="#e8ad8a" strokeWidth="1.4" fill="none" />
      </>
    );
  }

  if (expression === "excited") {
    return (
      <>
        <ellipse cx="37" cy="30" rx="6.5" ry="7" fill="white" />
        <circle cx="37" cy="31" r="3.8" fill="#3d2b1f" />
        <circle cx="38.8" cy="29.2" r="1.4" fill="white" />
        <ellipse cx="59" cy="30" rx="6.5" ry="7" fill="white" />
        <circle cx="59" cy="31" r="3.8" fill="#3d2b1f" />
        <circle cx="60.8" cy="29.2" r="1.4" fill="white" />
      </>
    );
  }

  // Neutral
  return (
    <>
      <ellipse cx="37" cy="30" rx="5.5" ry="6" fill="white" />
      <circle cx="37" cy="31" r="3.2" fill="#3d2b1f" />
      <circle cx="38.5" cy="29.5" r="1.1" fill="white" />
      <ellipse cx="59" cy="30" rx="5.5" ry="6" fill="white" />
      <circle cx="59" cy="31" r="3.2" fill="#3d2b1f" />
      <circle cx="60.5" cy="29.5" r="1.1" fill="white" />
    </>
  );
}

/* ── Mouth ─────────────────────────────────────── */
function Mouth({ expression }: { expression: ClydeExpression }) {
  if (expression === "thinking") {
    return (
      <path
        d="M42 49 Q48 47 54 49"
        stroke="#c07a6a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    );
  }

  if (expression === "happy") {
    return (
      <>
        <path d="M37 49 Q48 59 59 49" fill="#c0392b" opacity="0.85" />
        <path d="M37 49 Q48 53 59 49" fill="#f5f5f5" />
        <path d="M37 49 Q48 59 59 49" stroke="#9b2335" strokeWidth="1.2" fill="none" />
      </>
    );
  }

  if (expression === "excited") {
    return (
      <>
        <ellipse cx="48" cy="52" rx="9" ry="6" fill="#9b2335" />
        <ellipse cx="48" cy="50" rx="9" ry="3.8" fill="#f5f5f5" />
        <path d="M39 52 Q48 59 57 52" stroke="#9b2335" strokeWidth="1.2" fill="none" />
      </>
    );
  }

  // Neutral — gentle knowing smile
  return (
    <>
      <path d="M39 49 Q48 57 57 49" fill="#c0392b" opacity="0.7" />
      <path d="M39 49 Q48 52 57 49" fill="#f5f0ea" />
      <path d="M39 49 Q48 57 57 49" stroke="#9b2335" strokeWidth="1" fill="none" />
    </>
  );
}
