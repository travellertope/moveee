import type { Metadata } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import "./editorial.css";
import "./not-found.css";
import "./legal.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import CartDrawer from "@/components/CartDrawer";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CartProvider } from "@/context/CartContext";
import { AdsProvider, type AdSettings } from "@/context/AdsContext";
import Script from "next/script";
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
  title: {
    default: "The Moveee — Best in Culture",
    template: "%s | The Moveee",
  },
  description: "The Moveee is an independent magazine and community celebrating the best of African and diaspora culture — editorials, music, film, travel, lifestyle, and more.",
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
        alt: "The Moveee — Best in African Culture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Moveee — Best in African Culture",
    description: "The Moveee is an independent magazine and community celebrating the best of African and diaspora culture — editorials, music, film, travel, lifestyle, and more.",
    images: ["/og-fallback.png"],
  },
};

import { getWPData, GET_SITE_SETTINGS } from "@/lib/wp";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteData = await getWPData(GET_SITE_SETTINGS, {}, { revalidate: 3600 });

  const rawAds = siteData?.adSettings;
  const adSettings: AdSettings = {
    adsEnabled:              rawAds?.adsEnabled        ?? false,
    publisherId:             rawAds?.publisherId        ?? null,
    customScript:            rawAds?.customScript       ?? null,
    slotLeaderboardTop:      rawAds?.slotLeaderboardTop      ?? null,
    slotLeaderboardMid:      rawAds?.slotLeaderboardMid      ?? null,
    slotLeaderboardPreQuotes:rawAds?.slotLeaderboardPreQuotes ?? null,
    slotHeroSidebar:         rawAds?.slotHeroSidebar         ?? null,
  };

  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${dmSans.variable} ${fraunces.variable} ${jetBrainsMono.variable}`}
      >
        <SessionProvider>
          <CurrencyProvider
            detectedCountry={undefined}
            initialPricing={siteData?.membershipSettings || null}
          >
            <LanguageProvider>
              <CartProvider>
                <AdsProvider settings={adSettings}>
                  {/* AdSense loader — only injected when a publisher ID is set */}
                  {adSettings.adsEnabled && adSettings.publisherId && (
                    <Script
                      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSettings.publisherId}`}
                      strategy="afterInteractive"
                      crossOrigin="anonymous"
                    />
                  )}
                  {/* Custom ad script (e.g. Google Tag Manager, Ad Manager) */}
                  {adSettings.adsEnabled && adSettings.customScript && (
                    <Script
                      id="custom-ad-script"
                      strategy="afterInteractive"
                      dangerouslySetInnerHTML={{ __html: adSettings.customScript }}
                    />
                  )}
                  <Header siteSettings={siteData} />
                  <main>{children}</main>
                  <Footer />
                  <CartDrawer />
                  <CookieConsent />
                </AdsProvider>
              </CartProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
