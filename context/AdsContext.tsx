"use client";

import React, { createContext, useContext } from "react";

export interface AdSettings {
  adsEnabled: boolean;
  publisherId: string | null;
  customScript: string | null;
  slotLeaderboardTop: string | null;
  slotLeaderboardMid: string | null;
  slotLeaderboardPreQuotes: string | null;
  slotHeroSidebar: string | null;
}

const AdsContext = createContext<AdSettings>({
  adsEnabled: false,
  publisherId: null,
  customScript: null,
  slotLeaderboardTop: null,
  slotLeaderboardMid: null,
  slotLeaderboardPreQuotes: null,
  slotHeroSidebar: null,
});

export const useAds = () => useContext(AdsContext);

export function AdsProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: AdSettings;
}) {
  return <AdsContext.Provider value={settings}>{children}</AdsContext.Provider>;
}
