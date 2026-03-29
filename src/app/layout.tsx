import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Clyde — Learn AI by doing real things",
  description:
    "Clyde helps you learn how to use AI by applying it to your real life. No lectures, no blank prompts — just useful help starting from your actual day.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%230c87f0'/><text y='.9em' x='50' text-anchor='middle' font-size='60' font-family='system-ui' font-weight='bold' fill='white'>C</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fafaf9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-surface-50 antialiased">{children}</body>
    </html>
  );
}
