"use client";

import { useEffect, useState } from "react";
import WalletClient from "./WalletClient";
import CouponsClient from "../coupons/CouponsClient";
import PerksClient from "../../connect/perks/PerksClient";

type Tab = "wallet" | "coupons" | "perks";

interface LedgerEntry {
  id: number;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface Perk {
  id: number;
  title: string;
  description: string;
  credit_cost: number;
  min_spend: number;
  min_spend_currency: string;
  expiry_days: number;
  max_per_user: number;
  max_total: number;
  redeemed_count: number;
  status: string;
  partner_directory_id: number;
  perk_type?: string;
  airtime_country?: string;
  airtime_amount_local?: number;
}

interface Props {
  credits: number;
  creditsPerGbp: number;
  entries: LedgerEntry[];
  isPro: boolean;
  userEmail: string;
  perks: Perk[];
  isLoggedIn: boolean;
  savedPhone: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "wallet",  label: "Wallet"  },
  { key: "coupons", label: "Coupons" },
  { key: "perks",   label: "Perks"   },
];

export default function WalletTabsClient({
  credits, creditsPerGbp, entries, isPro, userEmail,
  perks, isLoggedIn, savedPhone,
}: Props) {
  const [tab, setTab] = useState<Tab>("wallet");

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

      {tab === "wallet" && (
        <WalletClient
          credits={credits}
          creditsPerGbp={creditsPerGbp}
          entries={entries}
          isPro={isPro}
          userEmail={userEmail}
        />
      )}

      {tab === "coupons" && (
        <>
          <div className="acct-page-head">
            <p className="acct-page-eyebrow">Redeemed Perks</p>
            <h2 className="acct-page-title">My Coupons</h2>
            <p className="acct-page-sub">Show the QR code at checkout to redeem — coupons expire 14 days after redemption.</p>
          </div>
          <CouponsClient />
        </>
      )}

      {tab === "perks" && (
        <PerksClient
          perks={perks}
          credits={credits}
          isLoggedIn={isLoggedIn}
          savedPhone={savedPhone}
        />
      )}
    </>
  );
}
