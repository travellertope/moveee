"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Search, User, ShoppingBag } from "lucide-react";
import Ticker from "./Ticker";
import AuthModal from "./AuthModal";
import SearchOverlay from "./SearchOverlay";
import NotificationBell from "./NotificationBell";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
interface HeaderProps {
  variant?: "light" | "dark";
  siteSettings?: any;
}

const Header = ({ variant = "light", siteSettings }: HeaderProps) => {
  const { language, setLanguage } = useLanguage();
  const { data: session, status } = useSession();
  const { itemCount, openDrawer } = useCart();
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/") ? "true" : undefined;
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const tickerData = siteSettings?.mastheadTicker || {};
  const user = session?.user as any;
  const loggedIn = status === "authenticated";

  React.useEffect(() => {
    const handleOpenModal = () => {
      if (!loggedIn) setModalOpen(true);
    };
    window.addEventListener('open-auth-modal', handleOpenModal);
    return () => window.removeEventListener('open-auth-modal', handleOpenModal);
  }, [loggedIn]);

  return (
    <>
      {/* Auth modal — renders only when open and not logged in */}
      {modalOpen && !loggedIn && (
        <AuthModal onClose={() => setModalOpen(false)} />
      )}

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
          {/* Language Toggle */}
          <div className="absolute right-0 top-0 bottom-0 flex items-center bg-black px-6 border-l border-white/10 z-10 transition-colors">
            <div className="flex items-center space-x-1.5 text-[10px] tracking-[0.2em] font-sans font-medium text-white">
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
          {/* Desktop left nav */}
          <nav className="masthead-left">
            <Link href="/magazine" data-active={active("/magazine")}>Editorials</Link>
            <Link href="/events"   data-active={active("/events")}>Happenings</Link>
            <Link href="/journeys" data-active={active("/journeys")}>Origins</Link>
            <Link href="/shop"     data-active={active("/shop")}>Lifestyle</Link>
            <Link href="/connect"  data-active={active("/connect")}>Connect</Link>
          </nav>

          {/* Wordmark */}
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

          {/* Desktop right nav */}
          <div className="masthead-right">
            <button
              className="masthead-icon-btn"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <button
              className="masthead-icon-btn cart-icon-btn"
              aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}` : "Cart"}
              onClick={openDrawer}
              style={{ position: "relative" }}
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="cart-badge">{itemCount > 9 ? "9+" : itemCount}</span>
              )}
            </button>

            {/* Notification bell — logged-in only */}
            <NotificationBell />

            {/* User icon — links to /member when logged in, opens modal when not */}
            {loggedIn ? (
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

            {loggedIn ? (
              <Link href="/member" className="join-btn" style={{ textDecoration: "none" }}>
                Dashboard →
              </Link>
            ) : (
              <Link href="/connect" className="join-btn" style={{ textDecoration: "none" }}>
                Join →
              </Link>
            )}
          </div>

          {/* Mobile: search + cart + bell + hamburger */}
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
            {/* Notification bell on mobile (logged-in only) */}
            <NotificationBell />
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
            <Link href="/magazine" onClick={() => setMobileMenuOpen(false)} data-active={active("/magazine")}>Editorials</Link>
            <Link href="/events"   onClick={() => setMobileMenuOpen(false)} data-active={active("/events")}>Happenings</Link>
            <Link href="/journeys" onClick={() => setMobileMenuOpen(false)} data-active={active("/journeys")}>Origins</Link>
            <Link href="/shop"     onClick={() => setMobileMenuOpen(false)} data-active={active("/shop")}>Lifestyle</Link>
            <Link href="/connect"  onClick={() => setMobileMenuOpen(false)} data-active={active("/connect")}>Connect</Link>
          </div>

          {/* Member quick-links — only when logged in */}
          {loggedIn && (
            <div className="mobile-menu-member">
              <div className="mobile-menu-member-name">
                {user?.name?.split(" ")[0] ?? "Account"}
              </div>
              <div className="mobile-menu-member-links">
                <Link href="/member"           onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link href="/member/wallet"    onClick={() => setMobileMenuOpen(false)}>Wallet</Link>
                <Link href="/member/coupons"   onClick={() => setMobileMenuOpen(false)}>Coupons</Link>
                <Link href="/connect/perks"    onClick={() => setMobileMenuOpen(false)}>Perks</Link>
                <Link href="/member/settings"  onClick={() => setMobileMenuOpen(false)}>Settings</Link>
              </div>
            </div>
          )}

          <div className="mobile-menu-actions">
            {loggedIn ? (
              <Link
                href="/member"
                className="join-btn"
                style={{ textDecoration: "none" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard →
              </Link>
            ) : (
              <Link
                href="/connect"
                className="join-btn"
                style={{ textDecoration: "none" }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Join →
              </Link>
            )}
          </div>
        </nav>
      </div>

      {/* Search overlay — rendered outside the z-50 header container */}
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Header;
