"use client";

import { useState } from "react";
import CommunityTab from "./CommunityTab";
import PortfolioTab from "./PortfolioTab";

interface Profile {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string;
  tier: string;
  reputation: number;
  reputation_tier: string;
}

interface Props {
  profile: Profile;
}

const TEMPLATE_FILTERS = [
  { value: "",                  label: "All Posts" },
  { value: "hidden-gem",        label: "Places" },
  { value: "cultural-take",     label: "Takes" },
  { value: "food-review",       label: "Food" },
  { value: "project",           label: "Projects" },
  { value: "poll",              label: "Polls" },
];

export default function ProfileTabs({ profile }: Props) {
  const [tab, setTab] = useState<"community" | "portfolio">("community");
  const [template, setTemplate] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const TASTE_MAKER_THRESHOLD = 500;
  const portfolioUnlocked = profile.reputation >= TASTE_MAKER_THRESHOLD;

  const activeFilter = TEMPLATE_FILTERS.find(f => f.value === template) ?? TEMPLATE_FILTERS[0];

  return (
    <>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        borderBottom: "1px solid var(--rule, #e8e2d8)",
      }}>
        <button
          className={`prf-tab-btn${tab === "community" ? " prf-tab-btn--active" : ""}`}
          onClick={() => setTab("community")}
        >
          Community Activity
        </button>
        <button
          className={`prf-tab-btn${tab === "portfolio" ? " prf-tab-btn--active" : ""}`}
          onClick={() => setTab("portfolio")}
        >
          Portfolio
        </button>

        {tab === "community" && (
          <div className="prf-type-wrapper">
            <button
              type="button"
              className={`prf-type-btn${template ? " prf-type-btn--active" : ""}`}
              onClick={() => setDropdownOpen(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
            >
              {activeFilter.label}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" style={{ flexShrink: 0, opacity: 0.55, transform: dropdownOpen ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}>
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {dropdownOpen && (
              <>
                <div className="prf-type-overlay" aria-hidden="true" onClick={() => setDropdownOpen(false)} />
                <div role="listbox" aria-label="Filter by post type" className="prf-type-dropdown">
                  {TEMPLATE_FILTERS.map(f => (
                    <button
                      key={f.value}
                      type="button"
                      role="option"
                      aria-selected={template === f.value}
                      className={`prf-type-row${template === f.value ? " prf-type-row--active" : ""}`}
                      onClick={() => { setTemplate(f.value); setDropdownOpen(false); }}
                    >
                      {f.label}
                      {template === f.value && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M2.5 8.5l3.5 3.5 7-7" stroke="var(--ochre)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ paddingTop: "1.25rem" }}>
        {tab === "community" && (
          <CommunityTab
            username={profile.username}
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            tier={profile.tier}
            template={template}
          />
        )}
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
