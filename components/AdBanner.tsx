"use client";

import React, { useEffect, useRef } from "react";
import { useAds } from "@/context/AdsContext";

// Maps the human-readable slot name used in JSX to the AdSettings field
const SLOT_MAP: Record<string, keyof import("@/context/AdsContext").AdSettings> = {
  "leaderboard-top":       "slotLeaderboardTop",
  "leaderboard-mid":       "slotLeaderboardMid",
  "leaderboard-pre-quotes":"slotLeaderboardPreQuotes",
  "hero-sidebar":          "slotHeroSidebar",
};

interface AdBannerProps {
  /** Slot name — must match a key in SLOT_MAP above */
  slot: string;
  className?: string;
  format?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window { adsbygoogle: any[] }
}

const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  className = "",
  format = "auto",
  fullWidthResponsive = true,
}) => {
  const ads = useAds();
  const pushed = useRef(false);

  const slotField = SLOT_MAP[slot];
  const slotId = slotField ? (ads[slotField] as string | null) : null;
  const active = ads.adsEnabled && ads.publisherId && slotId;

  useEffect(() => {
    if (!active || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      // AdSense script not yet loaded
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ads.publisherId!}
        data-ad-slot={slotId!}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
};

export default AdBanner;
