import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
export const metadata: Metadata = {
  title: "سكني | سكن طلاب موثّق في دمياط ورأس البر",
  description: "منصة سكني لحجز السكن الطلابي الموثّق بجانب جامعة دمياط وجامعة حورس — شقق وغرف وأسِرّة بأسعار واضحة وحجز آمن.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "سكني",
    statusBarStyle: "default",
  },
};
export const viewport: Viewport = { themeColor: "#123B40" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
