"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EDITIONS } from "@/lib/editions";

const EDITION_ORDER = ["global", "uk", "us", "africa"] as const;

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
    <footer className="hb-footer">

      {/* Main link grid + right panel */}
      <div className="hb-footer-main">

        {/* Link columns */}
        <div className="hb-footer-cols">
          <div className="hb-footer-col">
            <h6>Editorials</h6>
            <ul>
              <li><Link href="/magazine">Latest Stories</Link></li>
              <li><Link href="/magazine?category=culture">Culture</Link></li>
              <li><Link href="/magazine?category=interviews">Portraits</Link></li>
              <li><Link href="/magazine?category=dispatches">Dispatches</Link></li>
              <li><Link href="/newsletter">Newsletter</Link></li>
            </ul>
          </div>

          <div className="hb-footer-col">
            <h6>Community</h6>
            <ul>
              <li><Link href="/connect">Moveee</Link></li>
              <li><Link href="/connect/people">Member Directory</Link></li>
              <li><Link href="/events">Happenings</Link></li>
              <li><Link href="/journeys">Origins</Link></li>
              <li><Link href="/visuals">Visuals</Link></li>
              <li><Link href="/quotes">Quotes</Link></li>
            </ul>
          </div>

          <div className="hb-footer-col">
            <h6>Play</h6>
            <ul>
              <li><Link href="/games">All Games</Link></li>
              <li><Link href="/games/trivia">Culture Trivia</Link></li>
              <li><Link href="/games/who-said-it">Who Said It?</Link></li>
              <li><Link href="/directory">Culture Directory</Link></li>
            </ul>
          </div>

          <div className="hb-footer-col">
            <h6>Lifestyle</h6>
            <ul>
              <li><Link href="/shop">Moveee Shop</Link></li>
              <li><Link href="/makers">Vetted Makers</Link></li>
              <li><Link href="/shop/shipping">Shipping &amp; Returns</Link></li>
              <li><Link href="/connect">Become a Member</Link></li>
              <li><Link href="/member">My Account</Link></li>
            </ul>
          </div>

          <div className="hb-footer-col">
            <h6>Company</h6>
            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy">Cookie Policy</Link></li>
              <li><Link href="/terms">Terms of Use</Link></li>
              <li><Link href="/ai-use">AI Use Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Right panel: social + newsletter */}
        <div className="hb-footer-right">
          <div className="hb-footer-social-block">
            <h6>Follow Us</h6>
            <div className="hb-footer-social-icons">
              <a href="https://instagram.com/themoveee" target="_blank" rel="noreferrer" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://twitter.com/themoveee" target="_blank" rel="noreferrer" aria-label="X / Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@themoveee" target="_blank" rel="noreferrer" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.93a8.19 8.19 0 0 0 4.79 1.53V7.02a4.85 4.85 0 0 1-1.02-.33z"/>
                </svg>
              </a>
              <a href="https://facebook.com/themoveee" target="_blank" rel="noreferrer" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@themoveee" target="_blank" rel="noreferrer" aria-label="YouTube">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="hb-footer-nl-block">
            <p className="hb-footer-nl-copy">
              Don&apos;t miss out on the latest stories by signing up for our newsletter.
            </p>
            <div className="hb-footer-nl-form">
              <input type="email" placeholder="Email Address" aria-label="Newsletter email" />
              <button type="button">Subscribe</button>
            </div>
            <p className="hb-footer-nl-note">
              By subscribing, you agree to our{" "}
              <Link href="/terms">Terms of Use</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </div>

        </div>
      </div>

      {/* Bottom strip */}
      <div className="hb-footer-bottom">
        <div className="hb-footer-copyright">
          © 2026 The Moveee. All Rights Reserved. The Moveee® is a trademark of The Moveee Ltd.
        </div>
        <div className="hb-footer-legal">
          <Link href="/terms">Terms &amp; Conditions</Link>
          <span>|</span>
          <Link href="/privacy">Privacy Policy</Link>
          <span>|</span>
          <Link href="/cookie-policy">Cookie Policy</Link>
          <span>|</span>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="hb-footer-edition">
          <label htmlFor="footer-edition-select" className="hb-footer-edition-label">Edition</label>
          <select
            id="footer-edition-select"
            value={currentEdition}
            onChange={handleEditionChange}
            className="hb-footer-edition-select"
          >
            {EDITION_ORDER.map((slug) => (
              <option key={slug} value={slug}>
                {EDITIONS[slug].label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
