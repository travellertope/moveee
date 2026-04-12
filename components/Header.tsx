"use client";

import React, { useState } from "react";
import Link from "next/link";
import Ticker from "./Ticker";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  variant?: "light" | "dark";
  siteSettings?: any;
}

const Header = ({ variant = "light", siteSettings }: HeaderProps) => {
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine current datestamp
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const tickerData = siteSettings?.mastheadTicker || {};

  return (
    <div className="relative z-50">
      <div className="relative group">
        <Ticker 
          issueText={tickerData.issueText}
          issueUrl={tickerData.issueUrl}
          announcementText={tickerData.announcementText}
          announcementUrl={tickerData.announcementUrl}
          locations={tickerData.locations}
          date={today}
        />
        {/* Language Toggle - Positioned on the right of the ticker bar */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center bg-black px-6 border-l border-white/10 z-10 transition-colors">
          <div className="flex items-center space-x-3 text-[10px] tracking-[0.2em] font-sans font-medium text-white">
            <button 
              onClick={() => setLanguage("EN")} 
              className={`${language === "EN" ? "text-white" : "text-white/40 hover:text-white transition-colors underline-offset-4"}`}
              style={{ textDecoration: language === "EN" ? "underline" : "none" }}
            >
              EN
            </button>
            <span className="text-white/20">|</span>
            <button 
              onClick={() => setLanguage("FR")} 
              className={`${language === "FR" ? "text-white" : "text-white/40 hover:text-white transition-colors underline-offset-4"}`}
              style={{ textDecoration: language === "FR" ? "underline" : "none" }}
            >
              FR
            </button>
          </div>
        </div>
      </div>

      <header className="masthead">
        <nav className="masthead-left">
          <Link href="/magazine">Magazine</Link>
          <Link href="/events">Events</Link>
          <Link href="/origins">Origins</Link>
          <Link href="/shop">Lifestyle</Link>
        </nav>
        <div className="wordmark">
          <div className="kicker">Est. 2022 · Best in Culture</div>
          <Link href="/" className="hover:opacity-80 transition-opacity flex justify-center">
            <img
              src="https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png"
              alt="The Moveee Logo"
              style={{ maxHeight: '48px', width: 'auto' }}
            />
          </Link>
        </div>
        <div className="masthead-right">
          <button>Search</button>
          <Link href="/account">Sign in</Link>
          <Link href="/connect" className="join-btn" style={{ textDecoration: 'none' }}>Join Connect →</Link>
        </div>
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
      </header>

      {/* Mobile menu */}
      <nav className={`mobile-menu ${mobileMenuOpen ? "mobile-menu--open" : ""}`}>
        <div className="mobile-menu-links">
          <Link href="/magazine" onClick={() => setMobileMenuOpen(false)}>Magazine</Link>
          <Link href="/events" onClick={() => setMobileMenuOpen(false)}>Events</Link>
          <Link href="/origins" onClick={() => setMobileMenuOpen(false)}>Origins</Link>
          <Link href="/shop" onClick={() => setMobileMenuOpen(false)}>Lifestyle</Link>
        </div>
        <div className="mobile-menu-actions">
          <button onClick={() => setMobileMenuOpen(false)}>Search</button>
          <Link href="/account" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
          <Link href="/connect" className="join-btn" style={{ textDecoration: 'none' }} onClick={() => setMobileMenuOpen(false)}>Join Connect →</Link>
        </div>
      </nav>
    </div>
  );
};

export default Header;
