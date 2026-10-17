import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQOD — Studio für Systemintegration",
  description:
    "SQOD verbindet ERP, CRM, Shop, Buchhaltung und Fachsoftware zu einem System, das zusammenarbeitet. Systemintegration für den Mittelstand – aus Deutschland, DSGVO-konform.",
};

export const viewport: Viewport = { themeColor: "#0c0c0b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;800&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
