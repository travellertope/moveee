"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/context/ThemeContext";
import SearchModal from "@/components/SearchModal";
import { onOpenSearchModal } from "@/lib/searchModalBus";
import "./header.css";

const SITE_URL = "https://themoveee.com";
const LOGO_URL =
  "https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png";

const NAV = [
  { href: "/feed",   label: "Feed",   icon: "feed"   },
  { href: "/events", label: "Events", icon: "events" },
  { href: "/games",  label: "Games",  icon: "games"  },
] as const;

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
    case "feed":
      return <svg {...common} strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /></svg>;
    case "events":
      return <svg {...common} strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "games":
      return <svg {...common} strokeWidth={1.8} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="4" /><path d="M7 12h.01M17 12h.01M14 9l1.5 1.5M15.5 9L14 10.5" /></svg>;
    case "magazine":
      return <svg {...common} strokeWidth={1.8} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
    case "bell":
      return <svg {...common} viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
    default:
      return null;
  }
}

// A plain "↗" character renders with emoji presentation (a colorful glyph)
// on several platforms/browsers by default — this small outline SVG avoids
// that font-dependent inconsistency for the external-link indicator.
function ExternalArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M7 17L17 7" /><path d="M7 7h10v10" />
    </svg>
  );
}

export default function ConnectHeader() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railMenuOpen, setRailMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const railUserMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/clear-cookies", { method: "POST" });
    } catch {
      // proceed with sign-out even if the cleanup call fails
    }
    signOut({ callbackUrl: "/login" });
  };
  const user = session?.user as any;

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

  // Lets pages other than this one trigger the same shared search modal —
  // e.g. /events' own inline search bar — without a second modal instance.
  useEffect(() => onOpenSearchModal(() => setSearchOpen(true)), []);

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
        <Link href="/feed" className="ch-rail-logo">
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
              <RailIcon name={item.icon} /> {item.label}
            </Link>
          ))}
          <Link href={`${SITE_URL}/magazine`} className="ch-rail-link ch-rail-link--ext">
            <RailIcon name="magazine" /> Magazine <ExternalArrow />
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
                <NotificationBell showLabel />
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
      <header className="ch-header">
        <div className="ch-inner">
          <Link href="/feed" className="ch-logo">
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
              Magazine <ExternalArrow />
            </Link>
          </nav>

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

      {/* Mobile nav drawer — same content/classes as the desktop rail (logo,
          search, main nav, spacer, bottom icon rows, account row at the
          very bottom), presented as a left-sliding drawer over a dimmed
          backdrop instead of a permanent column, per the approved mockup's
          Frame 4. */}
      <nav
        id="ch-mobile-nav"
        className={`ch-mobile-nav${mobileOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
      >
        <Link href="/feed" className="ch-mobile-nav-logo" onClick={() => setMobileOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="The Moveee" height={24} width={152} />
        </Link>

        <div className="ch-mobile-search-wrap">
          <button
            type="button"
            className="ch-mobile-search-btn"
            onClick={() => { setMobileOpen(false); setSearchOpen(true); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            Search Moveee…
          </button>
        </div>

        <div className="ch-mobile-nav-main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`ch-mobile-nav-link ch-mobile-nav-link--icon${isActive(item.href) ? " active" : ""}`}
            >
              <RailIcon name={item.icon} /> {item.label}
            </Link>
          ))}
          <Link href={`${SITE_URL}/magazine`} className="ch-mobile-nav-link ch-mobile-nav-link--icon ch-mobile-nav-link--external">
            <RailIcon name="magazine" /> Magazine <ExternalArrow />
          </Link>
        </div>

        <div className="ch-mobile-nav-spacer" />

        <div className="ch-mobile-nav-bottom">
          {RAIL_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="ch-mobile-nav-link ch-mobile-nav-link--icon" onClick={() => setMobileOpen(false)}>
              <RailIcon name={item.icon} /> {item.label}
            </Link>
          ))}
          <button type="button" onClick={toggleTheme} className="ch-mobile-nav-link ch-mobile-nav-link--icon" style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}>
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          {status === "authenticated" && user && (
            <Link href="/member/notifications" className="ch-mobile-nav-link ch-mobile-nav-link--icon" onClick={() => setMobileOpen(false)}>
              <RailIcon name="bell" /> Notifications
            </Link>
          )}

          {status === "authenticated" && user ? (
            <Link href="/member" className="ch-mobile-user" onClick={() => setMobileOpen(false)}>
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
            </Link>
          ) : status === "unauthenticated" ? (
            <div className="ch-mobile-auth">
              <Link href="/login" className="ch-btn-ghost">Sign in</Link>
              <Link href="/register" className="ch-btn-solid">Join</Link>
            </div>
          ) : null}
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
