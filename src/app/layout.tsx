import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://clyde.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Clyde — Learn AI by doing real things",
    template: "%s | Clyde",
  },
  description:
    "Clyde helps you learn how to use AI by applying it to your real life. No lectures, no blank prompts — just useful help starting from your actual day.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Clyde — Learn AI by doing real things",
    description:
      "Tell Clyde what's on your mind. He turns your messy thoughts into plans, to-dos, drafts, and decisions — and teaches you AI along the way.",
    url: APP_URL,
    siteName: "Clyde",
    locale: "en_US",
    type: "website",
    // og:image is auto-generated from src/app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Clyde — Learn AI by doing real things",
    description:
      "Tell Clyde what's on your mind. He turns your messy thoughts into plans, to-dos, and drafts — and teaches you AI along the way.",
    // auto-populated from opengraph-image.tsx
  },
  icons: {
    icon: [
      { url: "/favicon-v2.svg", type: "image/svg+xml" },
    ],
    // apple-touch-icon served dynamically from src/app/apple-icon.tsx
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Clyde",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fafaf9",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <Script
        defer
        data-domain={process.env.NEXT_PUBLIC_SITE_DOMAIN || "clyde.app"}
        src="https://plausible.io/js/script.js"
        strategy="afterInteractive"
      />
      <body className="min-h-screen bg-[var(--surface-page)] antialiased">{children}</body>
    </html>
  );
}
