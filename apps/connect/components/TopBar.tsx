"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { onOpenSearchModal } from "@/lib/searchModalBus";
import SearchModal from "@/components/SearchModal";
import "./top-bar.css";

export default function TopBar() {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = session?.user as any;

  // Subscribe to the cross-app search-open bus (e.g. from the nav rail or events page)
  useEffect(() => onOpenSearchModal(() => setSearchOpen(true)), []);

  // ⌘K / Ctrl+K global shortcut — mounted once here, not in ConnectHeader
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

  // Close user menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function openMobileNav() {
    window.dispatchEvent(new Event("moveee:open-mobile-nav"));
  }

  const handleSignOut = async () => {
    try { await fetch("/api/auth/clear-cookies", { method: "POST" }); } catch {}
    signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <header className="tb-bar">
        <div className="tb-inner">
          {/* Hamburger — mobile only */}
          <button type="button" className="tb-hamburger" onClick={openMobileNav} aria-label="Open menu">
            <span className="tb-hamburger-line" />
            <span className="tb-hamburger-line" />
            <span className="tb-hamburger-line" />
          </button>

          {/* Brand */}
          <Link href="/feed" className="tb-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png"
              alt="Moveee"
              height={28}
              width={178}
              className="tb-brand-img"
            />
          </Link>

          {/* Search pill — desktop only */}
          <button type="button" className="tb-search" onClick={() => setSearchOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <span className="tb-search-label">Search discussions, people…</span>
            <kbd className="tb-search-kbd">⌘K</kbd>
          </button>

          {/* Right actions */}
          <div className="tb-right">
            {/* Search icon — mobile only */}
            <button type="button" className="tb-icon-btn tb-search-icon" onClick={() => setSearchOpen(true)} aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
            </button>

            <button type="button" className="tb-icon-btn" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {status === "authenticated" && (
              <Link href="/post/new" className="tb-new-post-btn">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Post
              </Link>
            )}

            {status === "authenticated" && user ? (
              <div className="tb-user-wrap" ref={menuRef}>
                <button
                  type="button"
                  className="tb-avatar"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-expanded={menuOpen}
                  aria-label="User menu"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="tb-avatar-img" />
                  ) : (
                    <span className="tb-avatar-initial">
                      {(user.displayName || user.name || user.username || "M").charAt(0).toUpperCase()}
                    </span>
                  )}
                </button>
                {menuOpen && (
                  <div className="tb-user-menu" role="menu">
                    <div className="tb-user-name">{user.displayName || user.name}</div>
                    <div className="tb-user-tier">{user.tier === "patron" ? "Moveee Pro" : "Moveee Citizen"}</div>
                    <div className="tb-user-divider" />
                    <Link href="/member" className="tb-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>My Dashboard</Link>
                    <Link href="/member/wallet" className="tb-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>Wallet</Link>
                    <Link href="/member/settings" className="tb-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>Settings</Link>
                    {user?.isVendor && (
                      <Link href="/vendor/dashboard" className="tb-user-item" role="menuitem" onClick={() => setMenuOpen(false)}>Vendor Dashboard</Link>
                    )}
                    <div className="tb-user-divider" />
                    <button className="tb-user-item tb-user-item--danger" role="menuitem" onClick={handleSignOut}>Sign out</button>
                  </div>
                )}
              </div>
            ) : status === "unauthenticated" ? (
              <>
                <Link href="/login" className="tb-btn-ghost">Sign in</Link>
                <Link href="/register" className="tb-btn-solid">Join</Link>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* Single, globally-mounted SearchModal — receives opens from TopBar search button,
          ⌘K shortcut, and any page that calls openSearchModal() via the bus */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
