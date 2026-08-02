"use client";

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
  { key: "collection", label: "Collection", emoji: "🔖", href: "/member/collection" },
  { key: "settings", label: "Settings", emoji: "⚙️", href: "/member/settings" },
];

export default function AccountNav({ isPatron }: AccountNavProps) {
  const pathname = usePathname();

  return (
    <nav className="acct-nav">
      {NAV.filter((item) => item.key !== "events" || isPatron).map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`acct-nav-item${active ? " acct-nav-item--active" : ""}`}
          >
            <span className="acct-nav-item-emoji">{item.emoji}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
