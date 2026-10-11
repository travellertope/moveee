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

const TAB_STYLE_BASE: React.CSSProperties = {
  paddingBottom: "0.7rem",
  paddingTop: "0.9rem",
  fontSize: "0.8rem",
  background: "none",
  border: "none",
  cursor: "pointer",
  letterSpacing: "0.01em",
};

export default function ProfileTabs({ profile }: Props) {
  const [tab, setTab] = useState<"community" | "portfolio">("community");

  const TASTE_MAKER_THRESHOLD = 500;
  const portfolioUnlocked = profile.reputation >= TASTE_MAKER_THRESHOLD;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    ...TAB_STYLE_BASE,
    fontWeight: active ? 600 : 500,
    color: active ? "var(--ochre, #7a241c)" : "#7a6f5c",
    borderBottom: active ? "2px solid var(--ochre, #7a241c)" : "2px solid transparent",
  });

  return (
    <>
      <div style={{
        display: "flex", gap: "1.5rem",
        borderBottom: "1px solid var(--rule, #e8e2d8)",
      }}>
        <button style={tabStyle(tab === "community")} onClick={() => setTab("community")}>
          Community Activity
        </button>
        <button style={tabStyle(tab === "portfolio")} onClick={() => setTab("portfolio")}>
          Portfolio
        </button>
      </div>

      <div style={{ paddingTop: "1.25rem" }}>
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
