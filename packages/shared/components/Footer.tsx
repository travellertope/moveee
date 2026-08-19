"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EDITIONS } from "@/lib/editions";
import SubscribeForm from "@/components/SubscribeForm";

const EDITION_ORDER = ["global", "uk", "us", "africa"] as const;

// Community/auth routes don't exist in apps/site — proxy.ts 308-redirects
// every one of them (see its `connectPrefixes` array) to Site B. A Next
// <Link> to one of these is therefore wrong twice over: Next prefetches it
// as `/feed?_rsc=…`, which 308s cross-origin and dies on CORS ("No
// 'Access-Control-Allow-Origin' header"), and clicking it costs a wasted
// round-trip through the redirect. Link them straight at Site B instead.
const CONNECT_URL = "https://web.themoveee.com";

// Site-wide footer, rebuilt from mockups/web/moveee_homepage_wepresent_concept.html
// (WePresent's own structure: newsletter + socials up top, big-serif link
// columns, a small centred wordmark, one thin closing line) in Moveee's own
// dark-ink palette. Every link/feature below is real — the old 5-column
// layout's links are redistributed into 3 columns (Explore / Moveee /
// Company) rather than dropped; the newsletter form is the same
// SubscribeForm used elsewhere (wired to /api/newsletter/subscribe), and
// the edition switcher is the same cookie-setting <select> as before, just
// moved into the bottom utility row.
const Footer = () => {
  const pathname = usePathname();

  const pathSegments = pathname.split("/").filter(Boolean);
  const firstSeg = pathSegments[0];
  const currentEdition = (firstSeg === "uk" || firstSeg === "us" || firstSeg === "africa")
    ? firstSeg
    : "global";

  function handleEditionChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const slug = e.target.value as typeof EDITION_ORDER[number];
    document.cookie = `moveee_edition=${slug}; path=/; max-age=2592000; SameSite=Lax`;
    window.location.href = EDITIONS[slug].path;
  }

  return (
    <footer className="mfoot">
      <div className="mfoot-inner">
        <div className="mfoot-top">
          <div className="mfoot-newsletter">
            <h2>Stay close to <em>culture</em>.<br />Get our weekly dispatch.</h2>
            <form className="mfoot-form" onSubmit={(e) => e.preventDefault()}>
              <SubscribeForm
                placeholder="Your email address"
                buttonLabel="Subscribe →"
                inputClassName="mfoot-input"
                buttonClassName="mfoot-btn-filled"
                list="culture-drop"
              />
            </form>
          </div>

          <div className="mfoot-social">
            <a href="https://instagram.com/themoveee" target="_blank" rel="noreferrer" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a href="https://tiktok.com/@themoveee" target="_blank" rel="noreferrer" aria-label="TikTok">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.93a8.19 8.19 0 0 0 4.79 1.53V7.02a4.85 4.85 0 0 1-1.02-.33z" />
              </svg>
            </a>
            <a href="https://twitter.com/themoveee" target="_blank" rel="noreferrer" aria-label="X / Twitter">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mfoot-columns">
          <div className="mfoot-column">
            <span className="mfoot-column-label">Explore</span>
            <ul>
              <li><Link href="/magazine">Magazine</Link></li>
              <li><Link href="/newsletter">Newsletter</Link></li>
              <li><Link href="/journeys">Origins</Link></li>
              <li><Link href="/visuals">Visuals</Link></li>
              <li><a href={`${CONNECT_URL}/quotes`}>Quotes</a></li>
            </ul>
          </div>
          <div className="mfoot-column">
            <span className="mfoot-column-label">Moveee</span>
            <ul>
              <li><a href={`${CONNECT_URL}/feed`}>Feed</a></li>
              <li><a href={`${CONNECT_URL}/connect/people`}>People Near Me</a></li>
              <li><a href={`${CONNECT_URL}/events`}>Happenings</a></li>
              <li><a href={`${CONNECT_URL}/directory`}>Culture Directory</a></li>
              <li><a href={`${CONNECT_URL}/games`}>Games</a></li>
              <li><Link href="/shop">Shop</Link></li>
            </ul>
          </div>
          <div className="mfoot-column">
            <span className="mfoot-column-label">Company</span>
            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Use</Link></li>
              <li><Link href="/cookie-policy">Cookie Policy</Link></li>
              <li><Link href="/ai-use">AI Use Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mfoot-wordmark">moveee<span>.</span></div>

        <div className="mfoot-bottom">
          <span>© 2026 The Moveee. All Rights Reserved.</span>
          <div className="mfoot-edition">
            <label htmlFor="footer-edition-select">Edition</label>
            <select id="footer-edition-select" value={currentEdition} onChange={handleEditionChange}>
              {EDITION_ORDER.map((slug) => (
                <option key={slug} value={slug}>{EDITIONS[slug].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
