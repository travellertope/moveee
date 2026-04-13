import type { Metadata } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import "./editorial.css";
import "./not-found.css";
import "./newsletter.css";
import "./legal.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { LanguageProvider } from "@/context/LanguageContext";
import SessionProvider from "@/components/SessionProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://themoveee.com"),
  title: "The Moveee — Best in Culture",
  description: "Curated lifestyle, magazine, and community for the moveee.",
  alternates: {
    canonical: "/",
  },
};

import { getWPData, GET_SITE_SETTINGS } from "@/lib/wp";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteData = await getWPData(GET_SITE_SETTINGS);

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}
      >
        <SessionProvider>
          <LanguageProvider>
            <Header siteSettings={siteData} />
            <main>{children}</main>
            <Footer />
            <CookieConsent />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
