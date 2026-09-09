"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

const CONNECT_URL = "https://web.themoveee.com";

// The Moveee Lifestyle's own standalone footer — rebuilt verbatim from the
// approved identity mockup (moveee-lifestyle-identity.html). Mounted once
// from app/lifestyle/layout.tsx around every /lifestyle route, replacing the sitewide
// Footer entirely (ConditionalFooter.tsx excludes /lifestyle paths — see its own
// comment). Every link points at a real destination; the mockup's "Gift
// Cards" and "Meet the Makers" links were dropped rather than kept as dead
// links — neither has a real feature/page behind it (see CLAUDE.md's "Shop
// by Category + Meet the Makers sections removed"), and the mockup's
// fabricated "Index last updated {date}" line was dropped from the bottom
// bar for the same reason — there's no real backing data source for it.
export default function ShopFooter() {
  const { data: session } = useSession();
  const accountHref = session?.user
    ? `${CONNECT_URL}/member`
    : `${CONNECT_URL}/login?callbackUrl=${encodeURIComponent("https://themoveee.com/lifestyle")}`;

  return (
    <footer className="lfs-foot">
      <div className="lfs-foot-inner">
        <div className="lfs-foot-grid">
          <div className="lfs-foot-brand">
            <Image
              src="/logo-lifestyle-black.png"
              alt="Moveee Lifestyle"
              width={140}
              height={47}
              className="lfs-foot-logo"
            />
            <p>
              The maker marketplace inside Moveee — objects, indexed and
              credited, for people who live for culture.
            </p>
          </div>

          <div className="lfs-foot-col">
            <h5>Lifestyle</h5>
            <ul>
              <li><Link href="/lifestyle">Full Index</Link></li>
              <li><Link href="/lifestyle">New Arrivals</Link></li>
              <li><Link href="/lifestyle/edit">The Edit</Link></li>
            </ul>
          </div>

          <div className="lfs-foot-col">
            <h5>Makers</h5>
            <ul>
              <li><a href={`${CONNECT_URL}/lifestyle/become-a-maker`}>Sell on Moveee</a></li>
              <li><Link href="/journeys">Origins Journal</Link></li>
            </ul>
          </div>

          <div className="lfs-foot-col">
            <h5>Account</h5>
            <ul>
              <li><Link href="/register?tier=patron">Moveee Pro</Link></li>
              <li><Link href="/features/culture-credits">Culture Credits</Link></li>
              <li><a href={accountHref}>Track an Order</a></li>
            </ul>
          </div>
        </div>

        <div className="lfs-foot-bottom">
          <span>© {new Date().getFullYear()} Moveee Media Ltd</span>
          <Link href="/">themoveee.com</Link>
        </div>
      </div>
    </footer>
  );
}
