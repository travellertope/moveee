"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "@/components/NotificationBell";
import "./header.css";

const SITE_URL = "https://themoveee.com";
const LOGO_URL =
  "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const user = session?.user as any;

  // Close user dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === "/connect") return pathname === "/connect" || pathname.startsWith("/connect/");
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="ch-header">
        <div className="ch-inner">
          {/* Logo */}
          <Link href={SITE_URL} className="ch-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_URL}
              alt="The Moveee"
              className="ch-logo-img"
              height={28}
              width={178}
            />
            <span className="ch-logo-badge">Connect</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="ch-nav" aria-label="Main navigation">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`ch-nav-link${isActive(item.href) ? " active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            <Link href={`${SITE_URL}/magazine`} className="ch-nav-link ch-nav-link--external">
              Magazine ↗
            </Link>
          </nav>

          {/* Right: auth + bell + hamburger */}
          <div className="ch-right">
            {status === "authenticated" && user ? (
              <>
                <NotificationBell />
                <div className="ch-user-wrap" ref={userMenuRef}>
                  <button
                    className="ch-avatar"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="User menu"
                    aria-expanded={menuOpen}
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name ?? "avatar"} className="ch-avatar-img" />
                    ) : (
                      <span className="ch-avatar-initial">
                        {(user.name || user.username || "M").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </button>
                  {menuOpen && (
                    <div className="ch-user-menu" role="menu">
                      <div className="ch-user-name">{user.displayName || user.name}</div>
                      <div className="ch-user-tier">
                        {user.tier === "patron" ? "Connect Pro" : "Connect Citizen"}
                      </div>
                      <div className="ch-user-divider" />
                      <Link href="/member" className="ch-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>My Dashboard</Link>
                      <Link href="/member/wallet" className="ch-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>Wallet</Link>
                      <Link href="/member/settings" className="ch-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>Settings</Link>
                      {user.isVendor && (
                        <Link href="/vendor/dashboard" className="ch-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>Vendor Dashboard</Link>
                      )}
                      <div className="ch-user-divider" />
                      <button
                        className="ch-user-item ch-user-item--danger"
                        role="menuitem"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
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

            {/* Hamburger — mobile only */}
            <button
              className="ch-hamburger"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="ch-mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span className="ch-hamburger-line" />
              <span className="ch-hamburger-line" />
              <span className="ch-hamburger-line" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`ch-mobile-overlay${mobileOpen ? " open" : ""}`}
        aria-hidden="true"
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile nav drawer */}
      <nav
        id="ch-mobile-nav"
        className={`ch-mobile-nav${mobileOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`ch-mobile-nav-link${isActive(item.href) ? " active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
        <Link href={`${SITE_URL}/magazine`} className="ch-mobile-nav-link ch-mobile-nav-link--external">
          Magazine ↗
        </Link>

        {status === "unauthenticated" && (
          <>
            <div className="ch-mobile-nav-divider" />
            <div className="ch-mobile-auth">
              <Link href="/login" className="ch-btn-ghost">Sign in</Link>
              <Link href="/register" className="ch-btn-solid">Join</Link>
            </div>
          </>
        )}

        {status === "authenticated" && user && (
          <>
            <div className="ch-mobile-nav-divider" />
            <Link href="/member" className="ch-mobile-nav-link">My Dashboard</Link>
            <Link href="/member/wallet" className="ch-mobile-nav-link">Wallet</Link>
            <Link href="/member/settings" className="ch-mobile-nav-link">Settings</Link>
            {user.isVendor && (
              <Link href="/vendor/dashboard" className="ch-mobile-nav-link">Vendor Dashboard</Link>
            )}
            <div className="ch-mobile-nav-divider" />
            <button
              className="ch-mobile-nav-link ch-user-item--danger"
              style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </button>
          </>
        )}
      </nav>
    </>
  );
}
