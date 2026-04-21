import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Clyde — Learn AI by doing real things";
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

        {/* Avatar circle */}
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            backgroundColor: "#e0efff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            marginBottom: 32,
          }}
        >
          👋
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#1c1917",
            letterSpacing: "-3px",
            lineHeight: 1,
            marginBottom: 20,
          }}
        >
          Clyde
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 32,
            color: "#57534e",
            textAlign: "center",
            maxWidth: 720,
            lineHeight: 1.4,
            marginBottom: 48,
          }}
        >
          Learn AI by doing real things — not lectures
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
          Try it free — no experience needed
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
