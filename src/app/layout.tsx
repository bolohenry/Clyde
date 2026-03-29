import type { Metadata } from "next";
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
