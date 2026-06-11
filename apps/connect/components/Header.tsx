"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import "./header.css";

const SITE_URL = "https://themoveee.com";

const NAV = [
  { href: "/connect",   label: "Feed"      },
  { href: "/events",    label: "Events"    },
  { href: "/directory", label: "Directory" },
  { href: "/games",     label: "Games"     },
];

export default function ConnectHeader() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user as any;

  return (
    <header className="ch-header">
      <div className="ch-inner">
        {/* Logo */}
        <Link href={SITE_URL} className="ch-logo">
          <span className="ch-logo-text">The Moveee</span>
          <span className="ch-logo-badge">Connect</span>
        </Link>

        {/* Nav */}
        <nav className="ch-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ch-nav-link${pathname.startsWith(item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href={`${SITE_URL}/magazine`} className="ch-nav-link ch-nav-link--external">
            Magazine ↗
          </Link>
        </nav>

        {/* Right */}
        <div className="ch-right">
          {status === "authenticated" && user ? (
            <>
              <NotificationBell />
              <div className="ch-user-wrap">
                <button
                  className="ch-avatar"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="User menu"
                >
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt={user.name ?? "avatar"} className="ch-avatar-img" />
                    : <span className="ch-avatar-initial">{(user.name || user.username || "M").charAt(0).toUpperCase()}</span>
                  }
                </button>
                {menuOpen && (
                  <div className="ch-user-menu" onClick={() => setMenuOpen(false)}>
                    <div className="ch-user-name">{user.displayName || user.name}</div>
                    <div className="ch-user-tier">{user.tier === "patron" ? "Connect Pro" : "Connect Citizen"}</div>
                    <div className="ch-user-divider" />
                    <Link href="/member" className="ch-user-item">My Dashboard</Link>
                    <Link href="/member/wallet" className="ch-user-item">Wallet</Link>
                    <Link href="/member/settings" className="ch-user-item">Settings</Link>
                    {user.isVendor && (
                      <Link href="/vendor/dashboard" className="ch-user-item">Vendor Dashboard</Link>
                    )}
                    <div className="ch-user-divider" />
                    <button className="ch-user-item ch-user-item--danger" onClick={() => signOut({ callbackUrl: "/login" })}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/login" className="ch-btn-ghost">Sign in</Link>
              <Link href="/register" className="ch-btn-solid">Join</Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
