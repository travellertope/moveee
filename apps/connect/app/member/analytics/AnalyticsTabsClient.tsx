"use client";

import { useEffect, useState } from "react";
import AnalyticsClient from "./AnalyticsClient";
import ReferralsClient from "../referrals/ReferralsClient";

type Tab = "analytics" | "referrals";

interface ReferredUser {
  username: string;
  displayName: string;
  joinedAt: number;
}

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  referralCount: number;
  repPerReferral: number;
  creditsPerReferral: number;
  referredUsers: ReferredUser[];
  connectorThreshold: number;
  superConnectorThreshold: number;
}

interface Props {
  userId: string;
  isPatron: boolean;
  referralsData: ReferralData | null;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "analytics",  label: "Analytics"  },
  { key: "referrals",  label: "Referrals"  },
];

export default function AnalyticsTabsClient({ userId, isPatron, referralsData }: Props) {
  const [tab, setTab] = useState<Tab>("analytics");

  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.some(t => t.key === hash)) setTab(hash);
  }, []);

  function switchTab(t: Tab) {
    setTab(t);
    window.history.replaceState(null, "", `#${t}`);
  }

  return (
    <>
      <div className="acct-subtabs">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            className={`acct-subtab${tab === t.key ? " acct-subtab--active" : ""}`}
            onClick={() => switchTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "analytics" && (
        <AnalyticsClient userId={userId} isPatron={isPatron} />
      )}

      {tab === "referrals" && (
        <ReferralsClient initialData={referralsData} />
      )}
    </>
  );
}
