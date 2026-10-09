"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useTheme } from "@/context/ThemeContext";
import "./header.css";

const SITE_URL = "https://themoveee.com";

const NAV = [
  { href: "/feed",                 label: "Home Feed",       icon: "feed"      },
  { href: "/discover",             label: "Explore Topics",  icon: "discover"  },
  { href: "/member/bookmarks",     label: "Bookmarks",       icon: "bookmark"  },
  { href: "/member/notifications", label: "Notifications",   icon: "bell"      },
  { href: "/stoop",                label: "Stoop IRL",       icon: "stoop"     },
] as const;

const HUB_SPACES = [
  { slug: "music",      label: "Music",      color: "#10b981" },
  { slug: "fashion",    label: "Fashion",    color: "#3b82f6" },
  { slug: "art",        label: "Art",        color: "#a855f7" },
  { slug: "literature", label: "Literature", color: "#f59e0b" },
] as const;

function RailIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "discover":
      return <svg {...common} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>;
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
    case "bookmark":
      return <svg {...common} viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
    default:
      return null;
  }
}

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railMenuOpen, setRailMenuOpen] = useState(false);
  const railUserMenuRef = useRef<HTMLDivElement>(null);
  const user = session?.user as any;

  const handleSignOut = async () => {
    try { await fetch("/api/auth/clear-cookies", { method: "POST" }); } catch {}
    signOut({ callbackUrl: "/login" });
  };

  // Close rail dropdown on outside click
  useEffect(() => {
    if (!railMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (railUserMenuRef.current && !railUserMenuRef.current.contains(e.target as Node)) {
        setRailMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [railMenuOpen]);

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // TopBar's hamburger dispatches this event instead of calling into this component directly
  useEffect(() => {
    function onOpenNav() { setMobileOpen(true); }
    window.addEventListener("moveee:open-mobile-nav", onOpenNav);
    return () => window.removeEventListener("moveee:open-mobile-nav", onOpenNav);
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
      <button className="ch-user-item ch-user-item--danger" role="menuitem" onClick={handleSignOut}>Sign out</button>
    </>
  );

  return (
    <>
      {/* ══════════════ Desktop left rail (≥860px) ══════════════ */}
      <aside className="ch-rail" aria-label="Main navigation">
        <div className="ch-rail-section-label">Menu</div>
        <nav className="ch-rail-nav">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`ch-rail-link${isActive(item.href) ? " active" : ""}`}>
              <RailIcon name={item.icon} /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="ch-rail-section-label ch-rail-section-label--spaced">Spaces</div>
        <div className="ch-rail-nav">
          {HUB_SPACES.map((hub) => (
            <Link key={hub.slug} href={`/hub/${hub.slug}`} className={`ch-rail-link ch-rail-hub-link${pathname.startsWith(`/hub/${hub.slug}`) ? " active" : ""}`}>
              <span className="ch-rail-hub-dot" style={{ background: hub.color }} />
              # {hub.label}
            </Link>
          ))}
        </div>

        <div className="ch-rail-spacer" />

        <div className="ch-rail-bottom">

          {status === "authenticated" && user ? (
            <div className="ch-rail-user-wrap" ref={railUserMenuRef}>
              <button type="button" className="ch-rail-user" onClick={() => setRailMenuOpen((v) => !v)} aria-expanded={railMenuOpen}>
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
          ) : null}
        </div>
      </aside>

      {/* Mobile overlay */}
      <div className={`ch-mobile-overlay${mobileOpen ? " open" : ""}`} aria-hidden="true" onClick={() => setMobileOpen(false)} />

      {/* Mobile nav drawer — slides in from the left when TopBar's hamburger fires the event */}
      <nav id="ch-mobile-nav" className={`ch-mobile-nav${mobileOpen ? " open" : ""}`} aria-label="Mobile navigation">
        <div className="ch-mobile-nav-section">
          <div className="ch-mobile-section-label">Menu</div>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={`ch-mobile-nav-link ch-mobile-nav-link--icon${isActive(item.href) ? " active" : ""}`} onClick={() => setMobileOpen(false)}>
              <RailIcon name={item.icon} /> {item.label}
            </Link>
          ))}
          <Link href={`${SITE_URL}/magazine`} className="ch-mobile-nav-link ch-mobile-nav-link--icon ch-mobile-nav-link--external" onClick={() => setMobileOpen(false)}>
            <RailIcon name="magazine" /> Magazine <ExternalArrow />
          </Link>
          <Link href="/events" className="ch-mobile-nav-link ch-mobile-nav-link--icon" onClick={() => setMobileOpen(false)}>
            <RailIcon name="events" /> Events
          </Link>
          <Link href="/games" className="ch-mobile-nav-link ch-mobile-nav-link--icon" onClick={() => setMobileOpen(false)}>
            <RailIcon name="games" /> Games
          </Link>
        </div>

        <div className="ch-mobile-nav-section">
          <div className="ch-mobile-section-label">Spaces</div>
          {HUB_SPACES.map((hub) => (
            <Link key={hub.slug} href={`/hub/${hub.slug}`} className="ch-mobile-nav-link" onClick={() => setMobileOpen(false)}>
              <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: hub.color, marginRight: 10, flexShrink: 0 }} />
              # {hub.label}
            </Link>
          ))}
        </div>

        <div className="ch-mobile-nav-spacer" />

        <div className="ch-mobile-nav-bottom">
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
    </>
  );
}
