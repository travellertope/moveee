"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import ShopSearchModal from "./ShopSearchModal";

const CONNECT_URL = "https://web.themoveee.com";

// The Moveee Lifestyle's own standalone masthead — ticker + logo + a
// left-hand Categories menu, then a right-hand cluster (text nav,
// search/account/bag icons) — rebuilt verbatim from the approved identity
// mockup (moveee-lifestyle-identity.html), then reworked (September 2026)
// to move the text nav next to the icon group, and again (same month) to
// move Categories to a plain inline link list beside the logo instead of a
// hover dropdown/mobile <details> disclosure — the old .mast-cat/.mast-filter
// dropdown markup is gone; Categories now just reuses .mast-nav-link styling
// like the right-hand nav does. Mounted once from app/lifestyle/layout.tsx
// around every /lifestyle route, replacing the sitewide floating pill
// entirely (Header.tsx returns null on /lifestyle paths — see its own
// comment). Real data throughout: live cart count, a session-aware account
// link, real fetched product categories. ShopSearchModal (opened by the
// search icon) still owns full search + price/material/etc. facets — this
// menu is a lightweight category-jump shortcut, not a duplicate of it.
// The right-hand .mast-nav destination list (The Edit, Magazine) is
// deliberately short and hand-picked, not auto-derived from anything —
// Shop/Makers were dropped per explicit user request (Shop is already the
// current page; Makers isn't a shop destination) and Magazine links out to
// the Moveee Magazine homepage rather than back into /lifestyle.
export default function ShopHeader() {
  const { itemCount, openDrawer } = useCart();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [proDiscountPercent, setProDiscountPercent] = useState(10);
  const [categories, setCategories] = useState<{ name: string; slug: string; count: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/categories")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (typeof d.proDiscountPercent === "number") setProDiscountPercent(d.proDiscountPercent);
        if (Array.isArray(d.categories)) setCategories(d.categories);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const accountHref = session?.user
    ? `${CONNECT_URL}/member`
    : `${CONNECT_URL}/login?callbackUrl=${encodeURIComponent("https://themoveee.com/lifestyle")}`;

  return (
    <>
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <React.Fragment key={i}>
              <span className="a">Vetted Makers</span>
              <span>Moveee Pro saves {proDiscountPercent}% storewide</span>
              <span>Earn Culture Credits on every order</span>
              <span>Free returns within 14 days</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="masthead">
        <div className="masthead-row">
          <div className="mast-left">
            <Link href="/lifestyle" className="mast-logo">
              <Image
                src="/logo-lifestyle-black.png"
                alt="Moveee Lifestyle"
                width={140}
                height={47}
                className="mast-logo-img"
                priority
              />
            </Link>

            {categories.length > 0 && (
              <nav className="mast-nav mast-cat-nav">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/lifestyle/category/${c.slug}`} className="mast-nav-link">
                    {c.name}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          <div className="mast-right">
            <nav className="mast-nav">
              <Link href="/lifestyle/edit" className="mast-nav-link">
                The Edit
              </Link>
              <Link href="https://themoveee.com" className="mast-nav-link">
                Magazine
              </Link>
            </nav>

            <div className="mast-icons">
              <button className="icon-btn" type="button" aria-label="Search" onClick={() => setSearchOpen(true)}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              <Link href={accountHref} className="icon-btn" aria-label="Account">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
                </svg>
              </Link>

              <button
                className="icon-btn bag-btn"
                type="button"
                aria-label={itemCount > 0 ? `Bag — ${itemCount} item${itemCount !== 1 ? "s" : ""}` : "Bag"}
                onClick={openDrawer}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8h12l-1 13H7z" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" />
                </svg>
                {itemCount > 0 && <span className="bag-count">{itemCount}</span>}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ShopSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
