"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User } from "lucide-react";
import Ticker from "./Ticker";
import AuthModal from "./AuthModal";
import { useLanguage } from "@/context/LanguageContext";

interface HeaderProps {
  variant?: "light" | "dark";
  siteSettings?: any;
}

const Header = ({ variant = "light", siteSettings }: HeaderProps) => {
  const { language, setLanguage } = useLanguage();
  const { data: session, status } = useSession();
  const [modalOpen, setModalOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tickerData = siteSettings?.mastheadTicker || {};
  const user = session?.user as any;
  const loggedIn = status === "authenticated";

  return (
    <>
      {/* Auth modal — renders only when open and not logged in */}
      {modalOpen && !loggedIn && (
        <AuthModal onClose={() => setModalOpen(false)} />
      )}

      <div className="relative z-50 group">
        <Ticker
          issueText={tickerData.issueText}
          issueUrl={tickerData.issueUrl}
          announcementText={tickerData.announcementText}
          announcementUrl={tickerData.announcementUrl}
          locations={tickerData.locations}
          date={today}
        />
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
              style={{ maxHeight: "48px", width: "auto" }}
            />
          </Link>
        </div>

        <div className="masthead-right">
          <button>Search</button>

          {/* User icon — links to /member when logged in, opens modal when not */}
          {loggedIn ? (
            <div style={{ position: "relative", display: "inline-flex" }} className="auth-menu-wrap">
              <Link
                href="/member"
                className="auth-icon-btn"
                title={user?.name ?? "My account"}
                aria-label="My account"
              >
                <User size={18} strokeWidth={1.5} />
                <span className="auth-icon-label">
                  {user?.name?.split(" ")[0] ?? "Account"}
                </span>
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="auth-icon-btn"
              title="Sign in"
              aria-label="Sign in to your account"
            >
              <User size={18} strokeWidth={1.5} />
              <span className="auth-icon-label">Sign in</span>
            </button>
          )}

          <Link href="/register" className="join-btn" style={{ textDecoration: "none" }}>
            Join →
          </Link>
        </div>
      </header>
    </>
  );
};

export default Header;
