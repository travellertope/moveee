import Header from "@/components/Header";
import ConditionalFooter from "@/components/ConditionalFooter";
import CookieConsent from "@/components/CookieConsent";
import CartDrawer from "@/components/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { AdsProvider, type AdSettings } from "@/context/AdsContext";
import GlobalAuthModal from "@/components/GlobalAuthModal";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import Script from "next/script";
import { getWPData, GET_SITE_SETTINGS } from "@/lib/wp";
import "../homepage.css";
import "../header.css";
import "../footer.css";
import "../homepage-v2.css";
import "../moveee-zone.css";
import "../features.css";
import "../editorial.css";
import "../not-found.css";
import "../legal.css";
import "../literary.css";
import "../commons.css";

export default async function MagazineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <CartProvider>
      <AdsProvider settings={adSettings}>
        {adSettings.adsEnabled && adSettings.publisherId && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSettings.publisherId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
        {adSettings.adsEnabled && adSettings.customScript && (
          <Script
            id="custom-ad-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: adSettings.customScript }}
          />
        )}
        <Header />
        <main>{children}</main>
        <ConditionalFooter />
        <CartDrawer />
        <CookieConsent />
        <GlobalAuthModal />
        <PwaInstallPrompt />
      </AdsProvider>
    </CartProvider>
  );
}
