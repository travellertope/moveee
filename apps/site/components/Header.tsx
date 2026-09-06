"use client";

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import SearchOverlay from "./SearchOverlay";
import ShopSearchModal from "./ShopSearchModal";
import { useCart } from "@/context/CartContext";

const CONNECT_URL = "https://web.themoveee.com";

interface FeaturedProduct {
  name: string;
  slug: string;
  price: string;
  image: string | null;
}

// Site-wide floating pill header (search · logo · cart · menu), rebuilt
// from mockups/web/moveee_homepage_wepresent_concept.html — transparent
// over a page's full-bleed dark hero (only the homepage has one), solid
// blurred pill everywhere else, auto-hides on scroll-down and returns
// near-instantly on scroll-up. Cart and the session-aware account state
// are preserved from the previous compact-header; the account state now
// lives entirely inside the full-screen menu overlay (no separate
// always-visible avatar/sign-in button) since the overlay already covers
// it. The language switcher and masthead ticker were dropped entirely
// per explicit product direction, not carried over anywhere.
const Header = () => {
  const { itemCount, openDrawer } = useCart();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");
  // Shop pages get a dedicated search+filter modal instead of the generic
  // sitewide one — see ShopSearchModal.tsx / apps/site/lib/shopFiltersBus.ts.
  const isShopPage = pathname === "/shop" || pathname.startsWith("/shop/");
  const isMakersPage = pathname === "/makers" || pathname.startsWith("/makers/");
  // Logo-branding scope only — deliberately broader than isShopPage (which
  // also gates the shop-specific search modal further below; /makers pages
  // still get the generic SearchOverlay, only the wordmark itself changes).
  const isLifestylePage = isShopPage || isMakersPage;
  // The Moveee Literary is its own standalone mini-site with its own
  // masthead, section nav, and footer (LiteraryMasthead.tsx/LiteraryFooter.tsx,
  // rendered from app/literary/layout.tsx) — the sitewide floating pill has
  // no role there at all, unlike Shop/Makers which only swap the wordmark.
  const isLiteraryPage = pathname === "/literary" || pathname.startsWith("/literary/");

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isSolid, setIsSolid] = useState(true);
  const [onDark, setOnDark] = useState(false);
  const [featuredProduct, setFeaturedProduct] = useState<FeaturedProduct | null>(null);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  const user = session?.user as any;

  const handleSignOut = useCallback(async () => {
    try {
      await fetch("/api/auth/clear-cookies", { method: "POST" });
    } catch {
      // proceed with sign-out even if the cleanup call fails
    }
    signOut({ callbackUrl: "https://themoveee.com/" });
  }, []);

  // Scroll-driven show/hide + solid/transparent state. Re-scans for every
  // `[data-header-zone="dark"]` element on the current page each time the
  // route changes (not just `.hero-full` — any page's dark first section,
  // e.g. .ar-hero on an article, .sr-hero on a series landing page,
  // .sl-trust on /shop, opts in the same way) and, on every scroll tick,
  // checks whether the header's own vertical position currently falls
  // inside ANY of them — so the header stays transparent (with light
  // logo/icon colours) for as long as it's floating over a dark zone,
  // wherever in the page that zone happens to sit, and picks up the
  // regular translucent-paper pill the instant it isn't. This replaces
  // the old binary "solid immediately on every non-homepage page" default
  // — a page with no dark zone at all still starts transparent, it just
  // never has a dark zone to render light-on-dark colours for.
  //
  // useLayoutEffect, not useEffect: the latter fires *after* the browser
  // has already painted the mount-time render (solid/dark-text, per the
  // useState defaults below) — so on the homepage the very first frame a
  // visitor sees was always the wrong one, corrected a tick later. That
  // read as "stuck solid" more often than not, since a visible correction
  // one frame in is easy to miss but a wrong *first* paint isn't.
  // useLayoutEffect runs synchronously after the DOM is hydrated but
  // before the browser paints anything, so `update()`'s result is what
  // actually gets painted first — no flash, no fix-up frame.
  useLayoutEffect(() => {
    let lastY = window.scrollY;
    let raf: number | null = null;

    function inDarkZone(y: number): boolean {
      // Re-queried on every call (cheap, and already rAF-throttled below)
      // rather than cached once at effect-mount time — caching it left a
      // hydration race where the very first update() (called synchronously
      // below, before the DOM necessarily reflects the just-hydrated page)
      // could find zero zones and latch the header solid/dark-text for the
      // rest of the page's life, never re-scanning until a resize. That's
      // what caused the homepage hero to render with a solid pill/dark
      // logo instead of transparent/light on initial load.
      const zones = Array.from(document.querySelectorAll<HTMLElement>('[data-header-zone="dark"]'));
      // Sample a bit below the header's own top edge (same -120/+40
      // grace the old single-hero check used) rather than bare scrollY,
      // so the switch happens once the header has genuinely cleared the
      // zone, not the instant scrollY passes its exact pixel boundary.
      const sampleY = y + 40;
      return zones.some((el) => {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        return sampleY >= top - 40 && sampleY < bottom - 120;
      });
    }

    function update() {
      const y = window.scrollY;
      const dark = inDarkZone(y);
      setOnDark(dark);
      setIsSolid(!dark);
      if (dark) {
        setIsHidden(false);
      } else if (y < lastY - 2) {
        setIsHidden(false);
      } else if (y > lastY + 6) {
        setIsHidden(true);
      }
      lastY = y;
    }

    update();
    // A second (and third) check shortly after mount — `update()` above
    // runs synchronously in the effect, which can land before the
    // browser has finished settling layout for content the server just
    // sent (web font swap, etc.), so `offsetTop`/`offsetHeight` on the
    // dark-zone element can occasionally still measure stale/zero at
    // that exact instant. That previously meant the homepage hero could
    // render with the solid pill on first paint and only correct itself
    // once a scroll/resize event happened to fire `update()` again. A
    // double-rAF re-check (plus `load`, for a slow image/font) closes
    // that gap without needing user interaction.
    const cleanupRafs: number[] = [];
    cleanupRafs.push(
      requestAnimationFrame(() => {
        cleanupRafs.push(requestAnimationFrame(update));
      })
    );
    window.addEventListener("load", update);
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        update();
        raf = null;
      });
    };
    const onResize = () => update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", update);
      cleanupRafs.forEach((id) => cancelAnimationFrame(id));
    };
  }, [pathname]);

  // Close the mobile body-scroll lock + fetch a fresh featured product
  // each time the menu opens (mirrors the mockup's shuffle-on-open, but
  // against the real API instead of a static pool).
  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menuOpen);
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    if (menuOpen) {
      setFeaturedLoading(true);
      fetch("/api/header/featured-product")
        .then((r) => r.json())
        .then((d) => setFeaturedProduct(d.product || null))
        .catch(() => setFeaturedProduct(null))
        .finally(() => setFeaturedLoading(false));
    }
  }, [menuOpen, searchOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close the menu on route change (client-side nav within a Link).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toolbarClass = [
    "site-toolbar",
    isHidden ? "is-hidden" : "",
    isSolid ? "is-solid" : "",
    onDark ? "is-on-dark" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // The Moveee Literary renders its own masthead/nav/footer (see the
  // comment on isLiteraryPage above) — every hook above still runs
  // unconditionally (Rules of Hooks), only the render is skipped.
  if (isLiteraryPage) return null;

  return (
    <>
      <div className={toolbarClass}>
        <div className="toolbar-shell">
          <div className="toolbar-pill">
            <Link href={isLifestylePage ? (isMakersPage ? "/makers" : "/shop") : "/"} className="toolbar-logo">
              <img
                src={
                  isLifestylePage
                    ? onDark ? "/logo-lifestyle-light.png" : "/logo-lifestyle-dark.png"
                    : onDark ? "/logo-light.png" : "/logo-dark.png"
                }
                alt={isLifestylePage ? "Moveee Lifestyle" : "Moveee"}
                className="toolbar-logo-img"
              />
            </Link>

            <div className="toolbar-icons">
              <button className="toolbar-icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </button>

              <button
                className="toolbar-icon"
                aria-label={itemCount > 0 ? `Cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}` : "Cart"}
                onClick={openDrawer}
              >
                <CartIcon />
                {itemCount > 0 && <span className="toolbar-cart-badge">{itemCount > 9 ? "9+" : itemCount}</span>}
              </button>

              <button
                className="toolbar-icon toolbar-icon--menu"
                aria-label="Menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MenuIcon open={menuOpen} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full-screen menu overlay ── */}
      <div className={`menu-overlay${menuOpen ? " is-open" : ""}`}>
        <div className="menu-overlay-bar">
          <button className="toolbar-icon" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <CloseIcon />
          </button>
          <Link href="/" className="toolbar-logo" onClick={() => setMenuOpen(false)}>
            {/* Overlay body is always the light `--paper` background,
                regardless of onDark — always the dark wordmark. */}
            <img src="/logo-dark.png" alt="Moveee" className="toolbar-logo-img" />
          </Link>
          <span />
        </div>

        <div className="menu-overlay-body">
          <div className="menu-grid">
            {/* Column 1 — nav */}
            <div>
              <p className="menu-col-label">Menu</p>
              <nav className="menu-nav-list">
                <a href={CONNECT_URL}>Feed</a>
                <a href={`${CONNECT_URL}/discover`}>Discover</a>
                <a href={`${CONNECT_URL}/events`}>Events</a>
                <Link href="/magazine" data-active={active("/magazine") || undefined}>Magazine</Link>
                <Link href="/literary" data-active={active("/literary") || undefined}>The Moveee Literary</Link>
                <Link href="/shop" data-active={active("/shop") || undefined}>Shop</Link>
                <Link href="/newsletter" data-active={active("/newsletter") || undefined}>Newsletter</Link>
              </nav>
            </div>

            {/* Column 2 — featured product */}
            <div>
              <p className="menu-col-label">From the Shop</p>
              {featuredLoading ? (
                <div className="menu-feature-card menu-feature-card--loading" />
              ) : featuredProduct ? (
                <Link href={`/shop/${featuredProduct.slug}`} className="menu-feature-card" onClick={() => setMenuOpen(false)}>
                  <div className="menu-feature-photo">
                    {featuredProduct.image && <img src={featuredProduct.image} alt={featuredProduct.name} />}
                  </div>
                  <p className="menu-feature-title">{featuredProduct.name}</p>
                  {featuredProduct.price && (
                    <div
                      className="menu-feature-price"
                      dangerouslySetInnerHTML={{ __html: featuredProduct.price }}
                    />
                  )}
                  <span className="menu-feature-cta">Shop now →</span>
                </Link>
              ) : (
                <Link href="/shop" className="menu-feature-card menu-feature-card--fallback" onClick={() => setMenuOpen(false)}>
                  <p className="menu-feature-title">Visit the Shop</p>
                  <span className="menu-feature-cta">Browse all products →</span>
                </Link>
              )}
            </div>

            {/* Column 3 — account */}
            <div>
              <p className="menu-col-label">Account</p>
              {status === "authenticated" && user ? (
                <div className="menu-account-card">
                  <div className="menu-account-id">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name ?? "avatar"} className="menu-account-avatar" />
                    ) : (
                      <span className="menu-account-avatar menu-account-avatar--initial">
                        {(user.name || user.username || "M").charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <div className="menu-account-name">{user.displayName || user.name}</div>
                      <div className="menu-account-tier">{user.tier === "patron" ? "Moveee Pro" : "Moveee Citizen"}</div>
                    </div>
                  </div>
                  <div className="menu-account-links">
                    <a href={`${CONNECT_URL}/member`}>My Dashboard</a>
                    <a href={`${CONNECT_URL}/feed`}>Feed</a>
                    <a href={`${CONNECT_URL}/member/wallet`}>Wallet</a>
                    <a href={`${CONNECT_URL}/member/settings`}>Settings</a>
                    <button className="danger" onClick={handleSignOut}>Sign Out</button>
                  </div>
                </div>
              ) : status === "unauthenticated" ? (
                <div className="menu-account-card menu-account-card--guest">
                  <p className="menu-account-guest-copy">Join Moveee to post, earn Culture Credits, and unlock Pro perks.</p>
                  <a
                    href={`${CONNECT_URL}/register?next=${encodeURIComponent("https://themoveee.com" + pathname)}`}
                    className="menu-guest-btn menu-guest-btn--primary"
                  >
                    Join →
                  </a>
                  <a
                    href={`${CONNECT_URL}/login?callbackUrl=${encodeURIComponent("https://themoveee.com" + pathname)}`}
                    className="menu-guest-btn"
                  >
                    Sign in
                  </a>
                </div>
              ) : (
                <div className="menu-account-card menu-account-card--loading" />
              )}
            </div>
          </div>
        </div>
        <div className="menu-overlay-foot">Best in Culture</div>
      </div>

      {isShopPage ? (
        <ShopSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      ) : (
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
};

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 4h1.6l1 8.4a1.2 1.2 0 001.2 1.1h6.4a1.2 1.2 0 001.2-1L14.6 6H4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="15" r="1" fill="currentColor" />
      <circle cx="12" cy="15" r="1" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .3s" }}>
      <path d="M2 5h12M2 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default Header;
