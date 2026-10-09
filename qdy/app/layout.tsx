import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QDY — Digital Marketing Studio",
  description: "QDY — цифровая студия маркетинга: performance, SMM, брендинг, контент и digital-продукты.",
};

export const viewport: Viewport = { themeColor: "#07060d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&family=Unbounded:wght@500;700;900&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
