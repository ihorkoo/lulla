import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

import { defaultLocale } from "@/i18n/request";
import messages from "@/i18n/messages/en.json";
import { QueryProvider } from "@/providers/query-provider";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "lulla — support for preterm parents",
  description:
    "AI-guided support for parents of preterm babies. Corrected-age-aware answers, grounded in clinical sources.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={defaultLocale} className={inter.variable}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider locale={defaultLocale} messages={messages}>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
