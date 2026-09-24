"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import CommonsLogo from "./CommonsLogo";
import SearchOverlay from "./SearchOverlay";
import { COMMONS_SECTIONS } from "@/lib/wp";

const CONNECT_URL = "https://web.themoveee.com";

// The Moveee Commons' own standalone masthead — replaces the sitewide
// floating pill entirely on every /commons route (see Header.tsx's
// isCommonsPage early return), same shape as LiteraryMasthead.tsx. Rendered
// once from app/commons/layout.tsx so it's consistent across the homepage,
// section archives, and single pieces.
export default function CommonsMasthead() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div className="comm-ribbon">
        <div className="comm-ribbon-inner">
          <span>Opinion, reports and research on the systems that govern us.</span>
          <Link href="/newsletter">Get Updates</Link>
        </div>
      </div>

      <header className="comm-masthead">
        <div className="comm-wrap comm-masthead-row">
          <CommonsLogo />
          <div className="comm-masthead-utility">
            {session?.user ? (
              <a href={`${CONNECT_URL}/member`} className="comm-util-link">
                My Account
              </a>
            ) : (
              <a
                href={`${CONNECT_URL}/login?callbackUrl=${encodeURIComponent("https://themoveee.com" + pathname)}`}
                className="comm-util-link"
              >
                Sign In
              </a>
            )}
            <Link href="/newsletter" className="comm-btn-pill comm-btn-pill--fill">
              Subscribe
            </Link>
            <button
              type="button"
              className="comm-search-icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.4" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <nav className="comm-nav" aria-label="The Moveee Commons sections">
        <div className="comm-wrap comm-nav-inner">
          {COMMONS_SECTIONS.map((s) => (
            <Link
              key={s.slug}
              href={`/commons/${s.slug}`}
              className={isActive(`/commons/${s.slug}`) ? "is-current" : undefined}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
