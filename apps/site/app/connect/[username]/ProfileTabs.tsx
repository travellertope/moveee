"use client";

import { useState } from "react";
import CommunityTab from "./CommunityTab";
import PortfolioTab from "./PortfolioTab";

interface Profile {
  id: number;
  username: string;
  reputation: number;
  reputation_tier: string;
}

interface Props {
  profile: Profile;
}

export default function ProfileTabs({ profile }: Props) {
  const [tab, setTab] = useState<"community" | "portfolio">("community");

  const TASTE_MAKER_THRESHOLD = 500;
  const portfolioUnlocked = profile.reputation >= TASTE_MAKER_THRESHOLD;

  return (
    <>
      <div className="prf-tabs">
        <button
          className={`prf-tab${tab === "community" ? " prf-tab--active" : ""}`}
          onClick={() => setTab("community")}
        >
          Community
        </button>
        <button
          className={`prf-tab${tab === "portfolio" ? " prf-tab--active" : ""}`}
          onClick={() => setTab("portfolio")}
        >
          Portfolio
        </button>
      </div>

      <div className="prf-body">
        {tab === "community" && <CommunityTab username={profile.username} />}
        {tab === "portfolio" && (
          <PortfolioTab
            username={profile.username}
            unlocked={portfolioUnlocked}
            reputationTier={profile.reputation_tier}
          />
        )}
      </div>
    </>
  );
}
