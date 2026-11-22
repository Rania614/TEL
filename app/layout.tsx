import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getLang } from "@/lib/auth";
import { WorldBackdrop } from "@/components/art/World";
import "./globals.css";

export const metadata: Metadata = {
  title: "The English Library",
  description: "A cozy personal library for Rabeha's English course — sessions, tasks, recordings and feedback.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5276C9" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const lang = await getLang();
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@500;600;700;800&family=Caveat:wght@500;600;700&family=Nunito:wght@400;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap"
        />
      </head>
      <body>
        <WorldBackdrop />
        <a href="#main" className="sr-only">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
