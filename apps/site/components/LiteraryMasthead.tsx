"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import LiteraryLogo from "./LiteraryLogo";
import SearchOverlay from "./SearchOverlay";
import { LITERARY_GENRES } from "@/lib/wp";

const CONNECT_URL = "https://web.themoveee.com";

// The Moveee Literary's own standalone masthead — replaces the sitewide
// floating pill entirely on every /literary route (see Header.tsx's
// isLiteraryPage early return). Rendered once from app/literary/layout.tsx
// so it's consistent across the landing page, genre archives, single
// pieces, and the submissions page — not just the homepage the mockup
// this was built from actually shows.
export default function LiteraryMasthead() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div className="lit-ribbon">
        <div className="lit-ribbon-inner">
          <span>New fiction, poetry, essays and translation, published continuously.</span>
          <Link href="/newsletter">Get Updates</Link>
        </div>
      </div>

      <header className="lit-masthead">
        <div className="lit-wrap lit-masthead-row">
          <LiteraryLogo />
          <div className="lit-masthead-utility">
            {session?.user ? (
              <a href={`${CONNECT_URL}/member`} className="lit-util-link">
                My Account
              </a>
            ) : (
              <a
                href={`${CONNECT_URL}/login?callbackUrl=${encodeURIComponent("https://themoveee.com" + pathname)}`}
                className="lit-util-link"
              >
                Sign In
              </a>
            )}
            <Link href="/literary/submit" className="lit-btn-pill">
              Submit
            </Link>
            <Link href="/newsletter" className="lit-btn-pill lit-btn-pill--fill">
              Subscribe
            </Link>
            <button
              type="button"
              className="lit-search-icon"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              ⚲
            </button>
          </div>
        </div>
      </header>

      <nav className="lit-nav" aria-label="The Moveee Literary sections">
        <div className="lit-wrap lit-nav-inner">
          {LITERARY_GENRES.map((g) => (
            <Link
              key={g.slug}
              href={`/literary/${g.slug}`}
              className={isActive(`/literary/${g.slug}`) ? "is-current" : undefined}
            >
              {g.label}
            </Link>
          ))}
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
