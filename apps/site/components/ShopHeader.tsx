"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import ShopSearchModal from "./ShopSearchModal";

const CONNECT_URL = "https://web.themoveee.com";

interface Category {
  name: string;
  slug: string;
  count: number;
}

// The Moveee Lifestyle's own standalone masthead — ticker + logo + a
// "Categories" dropdown + search/account/bag icons — rebuilt verbatim from
// the approved identity mockup (moveee-lifestyle-identity.html). Mounted
// once from app/shop/layout.tsx around every /shop route, replacing the
// sitewide floating pill entirely (Header.tsx returns null on /shop paths —
// see its own comment). Real data throughout: live cart count, a session-
// aware account link, and real fetched categories — no mockup placeholders.
export default function ShopHeader() {
  const { itemCount, openDrawer } = useCart();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [proDiscountPercent, setProDiscountPercent] = useState(10);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/categories")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setCategories(d.categories || []);
        if (typeof d.proDiscountPercent === "number") setProDiscountPercent(d.proDiscountPercent);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const accountHref = session?.user
    ? `${CONNECT_URL}/member`
    : `${CONNECT_URL}/login?callbackUrl=${encodeURIComponent("https://themoveee.com/shop")}`;

  const categoryList = (
    <>
      {categories.map((c) => (
        <Link key={c.slug} href={`/shop/category/${c.slug}`} className="mast-cat-item">
          <span className="mast-cat-lbl">{c.name}</span>
          {c.count > 0 && <span className="mast-cat-soon">{c.count}</span>}
        </Link>
      ))}
      <Link href="/shop" className="mast-cat-all">
        Full index →
      </Link>
    </>
  );

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
            <Link href="/shop" className="mast-logo">
              <Image
                src="/logo-lifestyle-black.png"
                alt="Moveee Lifestyle"
                width={140}
                height={47}
                className="mast-logo-img"
                priority
              />
            </Link>
            <nav className="mast-cat">
              <button className="mast-cat-btn" type="button" aria-haspopup="true" aria-expanded="false">
                Categories
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="mast-cat-panel">{categoryList}</div>
            </nav>
          </div>

          <div className="mast-icons">
            <details className="mast-filter">
              <summary className="icon-btn" aria-label="Browse categories">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <circle cx="9" cy="7" r="2" fill="var(--paper)" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                  <circle cx="16" cy="17" r="2" fill="var(--paper)" />
                </svg>
              </summary>
              <div className="mast-cat-panel mast-cat-panel--right">{categoryList}</div>
            </details>

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

      <ShopSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
