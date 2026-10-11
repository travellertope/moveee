"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import "./bottom-nav.css";

function NavIcon({ name }: { name: string }) {
  const s = { width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "feed":
      return (
        <svg {...s} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="4" rx="1" />
          <rect x="3" y="10" width="18" height="4" rx="1" />
          <rect x="3" y="16" width="18" height="4" rx="1" />
        </svg>
      );
    case "discover":
      return (
        <svg {...s} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case "stoop":
      return (
        <svg {...s} viewBox="0 0 24 24">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10h14V10" />
        </svg>
      );
    case "profile":
      return (
        <svg {...s} viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      );
    default:
      return null;
  }
}

const TABS = [
  { key: "feed",     href: "/feed",          label: "Feed",    icon: "feed"    },
  { key: "discover", href: "/discover",       label: "Discover", icon: "discover" },
  { key: "stoop",    href: "/connect/stoop",  label: "Stoop",   icon: "stoop"   },
  { key: "profile",  href: "/member",         label: "Profile", icon: "profile" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  function isActive(href: string) {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  }

  return (
    <nav className="bn-bar" aria-label="Main navigation">
      {/* Feed */}
      <Link href="/feed" className={`bn-tab${isActive("/feed") ? " bn-tab--active" : ""}`}>
        <NavIcon name="feed" />
        <span className="bn-label">Feed</span>
      </Link>

      {/* Discover */}
      <Link href="/discover" className={`bn-tab${isActive("/discover") ? " bn-tab--active" : ""}`}>
        <NavIcon name="discover" />
        <span className="bn-label">Discover</span>
      </Link>

      {/* Compose — centre action button */}
      <Link
        href={status === "unauthenticated" ? "/login" : "/post/new"}
        className="bn-compose"
        aria-label="New post"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>

      {/* Stoop IRL */}
      <Link href="/connect/stoop" className={`bn-tab${isActive("/connect/stoop") ? " bn-tab--active" : ""}`}>
        <NavIcon name="stoop" />
        <span className="bn-label">Stoop</span>
      </Link>

      {/* Profile */}
      <Link href="/member" className={`bn-tab${isActive("/member") ? " bn-tab--active" : ""}`}>
        <NavIcon name="profile" />
        <span className="bn-label">Profile</span>
      </Link>
    </nav>
  );
}
