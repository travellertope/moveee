"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ShoppingBag, User } from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";

const CONNECT_URL = "https://web.themoveee.com";

interface HeaderProps {
  variant?: "light" | "dark";
  siteSettings?: any;
}

const Header = ({ variant = "light", siteSettings }: HeaderProps) => {
  const { language, setLanguage } = useLanguage();
  const { itemCount, openDrawer } = useCart();
  const pathname = usePathname();
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/") ? "true" : undefined;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const tickerData = siteSettings?.mastheadTicker || {};
  const issueText = tickerData.issueText || "";
  const announcementText = tickerData.announcementText || "";
  const announcementUrl = tickerData.announcementUrl || "";
  const locations: string[] = tickerData.locations || [];

  return (
    <>
      <header className="compact-header">
        {/* Left zone: logo + divider + nav */}
        <div className="compact-header-left">
          <Link href="/" className="compact-logo">
            Moveee
          </Link>
          <div className="compact-logo-divider" />
          <nav className="compact-nav">
            <a href={CONNECT_URL} className="compact-nav-link">Feed</a>
            <a href={`${CONNECT_URL}/discover`} className="compact-nav-link">Discover</a>
            <Link href="/magazine" className="compact-nav-link" data-active={active("/magazine")}>Editorials</Link>
          </nav>
        </div>

        {/* Center zone: ticker info (desktop only, hidden ≤1100px) */}
        {issueText && (
          <div className="compact-ticker">
            <div className="compact-ticker-dot" />
            <div className="compact-ticker-info-wrap">
              <span className="compact-ticker-text">{issueText}</span>
              {(locations.length > 0 || announcementText) && (
                <div className="compact-ticker-tooltip">
                  {locations.length > 0 && (
                    <>
                      <span className="compact-ticker-tooltip-label">Touring</span>
                      <span className="compact-ticker-tooltip-locs">{locations.join(" · ")}</span>
                    </>
                  )}
                  {announcementText && (
                    <>
                      {locations.length > 0 && <div className="compact-ticker-tooltip-divider" />}
                      {announcementUrl ? (
                        <a href={announcementUrl} className="compact-ticker-tooltip-cta">
                          {announcementText} →
                        </a>
                      ) : (
                        <span className="compact-ticker-tooltip-cta">{announcementText}</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right zone: lang pills + icons + join */}
        <div className="compact-header-right">
          {/* Language pills */}
          <div className="lang-pills">
            <button
              onClick={() => setLanguage("EN")}
              className={`lang-pill${language === "EN" ? " lang-pill--active" : ""}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("FR")}
              className={`lang-pill${language === "FR" ? " lang-pill--active" : ""}`}
            >
              FR
            </button>
          </div>

          <button
            className="compact-icon-btn"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={17} strokeWidth={1.5} />
          </button>

          <button
            className="compact-icon-btn cart-icon-btn"
            aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}` : "Cart"}
            onClick={openDrawer}
            style={{ position: "relative" }}
          >
            <ShoppingBag size={17} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount > 9 ? "9+" : itemCount}</span>
            )}
          </button>

          <div className="compact-divider" />

          <div className="compact-sign-in-wrap">
            <a href={`${CONNECT_URL}/login`} className="compact-icon-btn" aria-label="Sign in">
              <User size={17} strokeWidth={1.5} />
            </a>
            <div className="compact-sign-in-tooltip">Sign in</div>
          </div>

          <a href={CONNECT_URL} className="compact-join-btn" style={{ textDecoration: "none" }}>
            Join →
          </a>
        </div>

        {/* Mobile: search + cart + hamburger */}
        <div className="masthead-mobile-actions">
          <button
            className="masthead-icon-btn"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={18} strokeWidth={1.5} />
          </button>
          <button
            className="masthead-icon-btn cart-icon-btn"
            aria-label="Cart"
            onClick={openDrawer}
            style={{ position: "relative" }}
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount > 9 ? "9+" : itemCount}</span>
            )}
          </button>
          <button
            className="masthead-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className={`hamburger-icon ${mobileMenuOpen ? "open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      {/* Mobile dropdown */}
      <nav className={`mobile-menu ${mobileMenuOpen ? "mobile-menu--open" : ""}`}>
        <div className="mobile-menu-links">
          <a href={CONNECT_URL} onClick={() => setMobileMenuOpen(false)}>Feed</a>
          <a href={`${CONNECT_URL}/discover`} onClick={() => setMobileMenuOpen(false)}>Discover</a>
          <Link href="/magazine" onClick={() => setMobileMenuOpen(false)} data-active={active("/magazine")}>Editorials</Link>
        </div>
        <div className="mobile-menu-actions">
          <a href={`${CONNECT_URL}/login`} className="mobile-menu-signin">Sign in</a>
          <a href={CONNECT_URL} className="join-btn" style={{ textDecoration: "none" }}>
            Join Moveee →
          </a>
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;
