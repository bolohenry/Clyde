import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Made with Clyde";
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

        {/* Clyde avatar circle */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#0c87f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
          }}
        >
          <span style={{ color: "white", fontSize: 48, fontWeight: 800 }}>C</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#1c1917",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Someone shared this with you
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize: 28,
            color: "#78716c",
            textAlign: "center",
            maxWidth: 720,
            lineHeight: 1.4,
            marginBottom: 40,
          }}
        >
          Open to see what Clyde made for them — and try it yourself.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 36px",
            backgroundColor: "#0c87f0",
            borderRadius: 48,
            color: "white",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          View on Clyde
        </div>

        {/* Bottom note */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
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
