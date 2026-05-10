"use client";

/**
 * AdBanner — Google AdSense / Ad Manager slot renderer.
 *
 * HOW TO MANAGE ADS FROM WORDPRESS:
 * 1. In WP Admin → Settings → Moveee Settings (or via ACF options page),
 *    add a field group called "Ad Slots" with text fields for each slot ID:
 *      - ad_slot_leaderboard_top
 *      - ad_slot_leaderboard_mid
 *      - ad_slot_leaderboard_pre_quotes
 *      - ad_slot_hero_sidebar
 *      - ad_slot_happenings_sidebar
 * 2. Fetch those values in page.tsx via GET_SITE_SETTINGS (extend the GraphQL query).
 * 3. Pass the slot ID as `adSlotId` prop — the component renders the AdSense unit.
 * 4. When a slot ID is empty/null in WP, the component renders nothing (no blank space).
 *
 * ENVIRONMENT VARIABLES (set in Vercel / .env.local):
 *   NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXX
 *
 * CURRENT MODE:
 *   While ad slot IDs are not yet configured, the component shows a subtle
 *   labelled placeholder so you can verify placement before going live.
 *   Set NEXT_PUBLIC_ADS_LIVE=true to suppress placeholders in production.
 */

import React, { useEffect, useRef } from "react";

interface AdBannerProps {
  /** Slot name used as a human-readable label (e.g. "leaderboard-top") */
  slot: string;
  /** Google AdSense ad-slot ID, e.g. "1234567890". Leave undefined to show placeholder. */
  adSlotId?: string;
  /** Optional extra class on the wrapper div */
  className?: string;
  /** Ad format passed to data-ad-format (default: "auto") */
  format?: string;
  /** Whether to allow full-width responsive (default: true) */
  fullWidthResponsive?: boolean;
}

const PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
const ADS_LIVE = process.env.NEXT_PUBLIC_ADS_LIVE === "true";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdBanner: React.FC<AdBannerProps> = ({
  slot,
  adSlotId,
  className = "",
  format = "auto",
  fullWidthResponsive = true,
}) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (!adSlotId || !PUBLISHER_ID || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      /* AdSense not loaded yet — script injected via next/script in layout */
    }
  }, [adSlotId]);

  /* Live ad unit */
  if (adSlotId && PUBLISHER_ID && ADS_LIVE) {
    return (
      <div className={className}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={PUBLISHER_ID}
          data-ad-slot={adSlotId}
          data-ad-format={format}
          data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        />
      </div>
    );
  }

  /* No live ad and no slot ID — render nothing so the wrapper collapses */
  return null;
};

export default AdBanner;
