import type { Metadata } from "next";
import { DM_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./homepage.css";
import "./moveee-zone.css";
import "./features.css";
import "./editorial.css";
import "./not-found.css";
import "./legal.css";
import Header from "@/components/Header";
import ConditionalFooter from "@/components/ConditionalFooter";
import CookieConsent from "@/components/CookieConsent";
import CartDrawer from "@/components/CartDrawer";
import { LanguageProvider } from "@/context/LanguageContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { CartProvider } from "@/context/CartContext";
import { AdsProvider, type AdSettings } from "@/context/AdsContext";
import Script from "next/script";
import SessionProvider from "@/components/SessionProvider";
import GlobalAuthModal from "@/components/GlobalAuthModal";

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
  verification: {
    google: "-PWVNI7d4eBu_a-Qo35KOTlAknn2MiciJ4c_ycsiqdc",
  },
  // Plain string, not `{ default, template }` — every page in this app
  // already builds its own complete, final title (including the "| Moveee" /
  // "| Moveee Magazine" brand suffix per the convention documented in
  // CLAUDE.md). A `template` here would append its suffix to whatever a page
  // returns, which double-suffixed almost every page site-wide (e.g. "Moveee
  // — Culture in Britain | Moveee"). A plain string is used verbatim as the
  // default for any page that sets no title of its own, and — critically —
  // is NOT combined with a child page's own title the way `template` is.
  // (Next.js's `Metadata` type also requires `template` whenever `title` is
  // an object with `default`, so `{ default: "..." }` alone doesn't even
  // type-check — this plain-string form is the correct way to get
  // default-without-template behavior.)
  title: "Moveee — Culture. Discover and Engage.",
  description: "Moveee is a community that rewards you for being an active part of culture — post, discover, and earn for your taste. Moveee Magazine is our editorial arm, covering the best of culture.",
  alternates: {
    canonical: "https://themoveee.com/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://themoveee.com",
    siteName: "Moveee",
    images: [
      {
        url: "/og-fallback.png",
        width: 1200,
        height: 630,
        alt: "Moveee — Culture. Discover and Engage.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@moveeemedia",
    creator: "@moveeemedia",
    title: "Moveee — Culture. Discover and Engage.",
    description: "Moveee is a community that rewards you for being an active part of culture — post, discover, and earn for your taste. Moveee Magazine is our editorial arm, covering the best of culture.",
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

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Moveee Magazine",
    url: "https://themoveee.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://themoveee.com/magazine?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Moveee Magazine",
    url: "https://themoveee.com",
    logo: "https://themoveee.com/logo.png",
    sameAs: [
      "https://twitter.com/moveeemedia",
      "https://instagram.com/moveeemedia",
    ],
    description: "An independent magazine for people who live for culture — music, film, art, food, travel, and ideas.",
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
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
                  <ConditionalFooter />
                  <CartDrawer />
                  <CookieConsent />
                  <GlobalAuthModal />
                </AdsProvider>
              </CartProvider>
            </LanguageProvider>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
