"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import ShopSearchModal from "./ShopSearchModal";

const CONNECT_URL = "https://web.themoveee.com";

// The Moveee Lifestyle's own standalone masthead — ticker + logo +
// search/account/bag icons — rebuilt verbatim from the approved identity
// mockup (moveee-lifestyle-identity.html). Mounted once from
// app/shop/layout.tsx around every /shop route, replacing the sitewide
// floating pill entirely (Header.tsx returns null on /shop paths — see its
// own comment). Real data throughout: live cart count, a session-aware
// account link. Category filtering lives exclusively inside ShopSearchModal
// (opened by the search icon) — the header itself no longer duplicates it.
export default function ShopHeader() {
  const { itemCount, openDrawer } = useCart();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);
  const [proDiscountPercent, setProDiscountPercent] = useState(10);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shop/categories")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
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
          </div>

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

      <ShopSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
