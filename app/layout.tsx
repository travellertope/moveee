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
import { CurrencyProvider } from "@/context/CurrencyContext";
import SessionProvider from "@/components/SessionProvider";
import { headers } from "next/headers";

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
  title: {
    default: "The Moveee — Best in Culture",
    template: "%s | The Moveee",
  },
  description: "Curated lifestyle, magazine, and community for the moveee.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://themoveee.com",
    siteName: "The Moveee",
    images: [
      {
        url: "/og-fallback.png",
        width: 1200,
        height: 630,
        alt: "The Moveee — Best in Culture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Moveee — Best in Culture",
    description: "Curated lifestyle, magazine, and community for the moveee.",
    images: ["/og-fallback.png"],
  },
};

import { getWPData, GET_SITE_SETTINGS } from "@/lib/wp";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteData = await getWPData(GET_SITE_SETTINGS);
  const headersList = await headers();
  const country = headersList.get("x-vercel-ip-country") || "US";

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}
      >
        <SessionProvider>
          <CurrencyProvider 
            detectedCountry={country} 
            initialPricing={siteData?.membershipSettings || null}
          >
            <LanguageProvider>
              <Header siteSettings={siteData} />
              <main>{children}</main>
              <Footer />
              <CookieConsent />
            </LanguageProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
