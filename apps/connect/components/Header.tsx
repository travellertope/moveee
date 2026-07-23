"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/context/ThemeContext";
import SearchModal from "@/components/SearchModal";
import "./header.css";

const SITE_URL = "https://themoveee.com";
const LOGO_URL =
  "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png";

const NAV = [
  { href: "/feed",   label: "Feed"   },
  { href: "/events", label: "Events" },
  { href: "/games",  label: "Games"  },
];

// Rendered at the bottom of the desktop rail — was the right-side icon
// cluster in the old top header. Order: Discover Culture, People Near Me,
// Stoop IRL, Interest Hubs (Stoop before Hubs, per the approved mockup).
const RAIL_LINKS = [
  { href: "/discover",       label: "Discover Culture", icon: "discover" },
  { href: "/connect/people", label: "People Near Me",   icon: "people"   },
  { href: "/connect/stoop",  label: "Stoop IRL",        icon: "stoop"    },
  { href: "/hub",            label: "Interest Hubs",    icon: "hub"      },
] as const;

function RailIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "discover":
      return <svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
    case "people":
      return <svg {...common} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "stoop":
      return <svg {...common} viewBox="0 0 24 24"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
    case "hub":
      return <svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="4" ry="10" /><path d="M2 12h20" /></svg>;
    default:
      return null;
  }
}

export default function ConnectHeader() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railMenuOpen, setRailMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navTop, setNavTop] = useState(60);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const railUserMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/clear-cookies", { method: "POST" });
    } catch {
      // proceed with sign-out even if the cleanup call fails
    }
    signOut({ callbackUrl: "/login" });
  };
  const user = session?.user as any;

  // Keep the mobile drawer pinned to the header's real bottom edge — the
  // header isn't always at viewport y:0 (the app download banner can sit
  // above it), so a hardcoded `top: 60px` overlaps the header whenever the
  // banner is showing and the page hasn't scrolled past it yet.
  useEffect(() => {
    function measure() {
      if (headerRef.current) {
        setNavTop(headerRef.current.getBoundingClientRect().bottom);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [mobileOpen]);

  // Close user dropdowns on outside click
  useEffect(() => {
    if (!menuOpen && !railMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (railMenuOpen && railUserMenuRef.current && !railUserMenuRef.current.contains(e.target as Node)) {
        setRailMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, railMenuOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ⌘K / Ctrl+K opens search from anywhere
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function isActive(href: string) {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  }

  const userMenuItems = (closeMenu: () => void) => (
    <>
      <div className="ch-user-name">{user?.displayName || user?.name}</div>
      <div className="ch-user-tier">
        {user?.tier === "patron" ? "Moveee Pro" : "Moveee Citizen"}
      </div>
      <div className="ch-user-divider" />
      <Link href="/member" className="ch-user-item" role="menuitem" onClick={closeMenu}>My Dashboard</Link>
      <Link href="/member/wallet" className="ch-user-item" role="menuitem" onClick={closeMenu}>Wallet</Link>
      <Link href="/member/settings" className="ch-user-item" role="menuitem" onClick={closeMenu}>Settings</Link>
      {user?.isVendor && (
        <Link href="/vendor/dashboard" className="ch-user-item" role="menuitem" onClick={closeMenu}>Vendor Dashboard</Link>
      )}
      <div className="ch-user-divider" />
      <button className="ch-user-item ch-user-item--danger" role="menuitem" onClick={handleSignOut}>
        Sign out
      </button>
    </>
  );

  return (
    <>
      {/* ══════════════ Desktop left rail (≥860px) ══════════════ */}
      <aside className="ch-rail" aria-label="Main navigation">
        <Link href={SITE_URL} className="ch-rail-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="The Moveee" height={24} width={152} />
        </Link>

        <div className="ch-rail-search-wrap">
          <button type="button" className="ch-rail-search-btn" onClick={() => setSearchOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            Search Moveee…
            <span className="ch-rail-search-kbd">⌘K</span>
          </button>
        </div>

        <nav className="ch-rail-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ch-rail-link${isActive(item.href) ? " active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href={`${SITE_URL}/magazine`} className="ch-rail-link ch-rail-link--ext">
            Magazine ↗
          </Link>
        </nav>

        <div className="ch-rail-spacer" />

        <div className="ch-rail-bottom">
          <div className="ch-rail-icon-row">
            {RAIL_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="ch-rail-icon-btn">
                <RailIcon name={item.icon} /> {item.label}
              </Link>
            ))}
            <button type="button" onClick={toggleTheme} className="ch-rail-icon-btn">
              {theme === "dark" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
              Theme
            </button>
            {status === "authenticated" && user && (
              <div className="ch-rail-icon-btn ch-rail-icon-btn--bell">
                <NotificationBell />
              </div>
            )}
          </div>

          {status === "authenticated" && user ? (
            <div className="ch-rail-user-wrap" ref={railUserMenuRef}>
              <button
                type="button"
                className="ch-rail-user"
                onClick={() => setRailMenuOpen((v) => !v)}
                aria-expanded={railMenuOpen}
              >
                <span className="ch-rail-user-avatar">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="ch-avatar-img" />
                  ) : (
                    <span className="ch-avatar-initial">{(user.name || user.username || "M").charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <span className="ch-rail-user-info">
                  <span className="ch-rail-user-name">{user.displayName || user.name}</span>
                  <span className="ch-rail-user-tier">{user.tier === "patron" ? "Moveee Pro" : "Moveee Citizen"}</span>
                </span>
              </button>
              {railMenuOpen && (
                <div className="ch-user-menu ch-user-menu--rail" role="menu">
                  {userMenuItems(() => setRailMenuOpen(false))}
                </div>
              )}
            </div>
          ) : status === "unauthenticated" ? (
            <div className="ch-rail-auth">
              <Link href="/login" className="ch-btn-ghost">Sign in</Link>
              <Link href="/register" className="ch-btn-solid">Join</Link>
            </div>
          ) : null}
        </div>
      </aside>

      {/* ══════════════ Mobile top header (<860px) — unchanged behaviour ══════════════ */}
      <header className="ch-header" ref={headerRef}>
        <div className="ch-inner">
          <Link href={SITE_URL} className="ch-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_URL} alt="The Moveee" className="ch-logo-img" height={28} width={178} />
          </Link>

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

          <div className="ch-right">
            <button type="button" aria-label="Search" className="ch-icon-btn" onClick={() => setSearchOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </button>
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
                      {userMenuItems(() => setMenuOpen(false))}
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

      {/* Mobile nav drawer — mirrors the desktop rail's content (main nav,
          then the same rail links + theme toggle), just as a slide-down
          panel instead of a permanent column. */}
      <nav
        id="ch-mobile-nav"
        className={`ch-mobile-nav${mobileOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
        style={{ top: navTop }}
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

        <div className="ch-mobile-nav-divider" />

        {RAIL_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className="ch-mobile-nav-link">
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={toggleTheme} className="ch-mobile-nav-link" style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>

        {status === "unauthenticated" && (
          <>
            <div className="ch-mobile-nav-divider" />
            <div className="ch-mobile-auth">
              <Link href="/login" className="ch-btn-ghost">Sign in</Link>
              <Link href="/register" className="ch-btn-solid">Join</Link>
            </div>
          </>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
