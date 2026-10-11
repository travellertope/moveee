"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AccountNavProps {
  isPatron: boolean;
}

interface NavEntry {
  key: string;
  label: string;
  emoji: string;
  href: string;
  /** Exact match required (Overview would otherwise also match every
   *  other /member/* sub-route as a prefix). */
  exact?: boolean;
}

const NAV: NavEntry[] = [
  { key: "overview", label: "Overview", emoji: "🏠", href: "/member", exact: true },
  { key: "wallet", label: "Wallet", emoji: "💳", href: "/member/wallet" },
  { key: "coupons", label: "Coupons", emoji: "🎟", href: "/member/coupons" },
  { key: "perks", label: "Perks", emoji: "🎁", href: "/connect/perks" },
  { key: "notifications", label: "Notifications", emoji: "🔔", href: "/member/notifications" },
  { key: "analytics", label: "Analytics", emoji: "📊", href: "/member/analytics" },
  { key: "events", label: "My Events", emoji: "📅", href: "/member/events" },
  { key: "referrals", label: "Referrals", emoji: "🤝", href: "/member/referrals" },
  { key: "portfolio", label: "Portfolio", emoji: "🎨", href: "/member/portfolio" },
  { key: "reading", label: "Culture Log", emoji: "📓", href: "/member/reading" },
  { key: "collection", label: "Collection", emoji: "🔖", href: "/member/collection" },
  { key: "settings", label: "Settings", emoji: "⚙️", href: "/member/settings" },
];

export default function AccountNav({ isPatron }: AccountNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((item) => item.key !== "events" || isPatron);

  const activeItem =
    items.find((item) =>
      item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`)
    ) ?? items[0];

  return (
    <>
      <div className="acct-nav-wrap">
        <button
          type="button"
          className="acct-nav-btn"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
        >
          <span>{activeItem.emoji}</span>
          <span>{activeItem.label}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <div
            className="acct-nav-overlay"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="acct-nav-sheet" role="dialog" aria-label="Account navigation">
            <div className="acct-nav-sheet-handle" />
            <div className="acct-nav-sheet-head">
              <span className="acct-nav-sheet-title">Account</span>
              <button
                type="button"
                className="acct-nav-sheet-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="acct-nav-sheet-list">
              {items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`acct-nav-row${isActive ? " acct-nav-row--active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="acct-nav-row-emoji">{item.emoji}</span>
                    <span className="acct-nav-row-label">{item.label}</span>
                    {isActive && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8l4 4 6-6" stroke="var(--ochre)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
