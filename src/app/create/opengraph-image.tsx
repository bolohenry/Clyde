import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Let me ask Clyde";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafaf9",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: "linear-gradient(90deg, #0c87f0, #38bdf8)",
          }}
        />

        {/* Share icon circle */}
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            backgroundColor: "#e0efff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
            marginBottom: 32,
          }}
        >
          🔗
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#1c1917",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          Let me ask Clyde
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 30,
            color: "#57534e",
            textAlign: "center",
            maxWidth: 760,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          Paste what they said. Add a screenshot or file. Get a link — they click it and Clyde is ready to help.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 40px",
            backgroundColor: "#0c87f0",
            borderRadius: 48,
            color: "white",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          Create a link — free, no account needed
        </div>

        {/* Bottom note */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "#a8a29e",
          }}
        >
          clyde.app
        </div>
      </div>
    ),
    { ...size }
  );
}
