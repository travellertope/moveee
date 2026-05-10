import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="hp-footer">

      {/* Wordmark bar */}
      <div className="hp-footer-wordmark-bar">
        <Link href="/">
          <img
            src="https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png"
            alt="The Moveee"
            className="hp-footer-logo"
          />
        </Link>
        <p className="hp-footer-tagline">
          Navigating the intersection of culture, lifestyle, and African heritage through curated
          visual stories and vetted commerce.
        </p>
      </div>

      {/* Newsletter bar */}
      <div className="hp-footer-nl-section">
        <div className="hp-footer-nl-copy">
          Stay inside the culture — stories, happenings and origins in your inbox.
        </div>
        <div className="hp-footer-nl-form">
          <input type="email" placeholder="Your email address" aria-label="Email for newsletter" />
          <button type="button">Subscribe</button>
        </div>
      </div>

      {/* Link columns */}
      <div className="hp-footer-links-grid">
        <div className="hp-footer-col">
          <h6>Editorials</h6>
          <ul>
            <li><Link href="/magazine">Latest Stories</Link></li>
            <li><Link href="/magazine?category=culture">Culture</Link></li>
            <li><Link href="/magazine?category=interviews">Portraits</Link></li>
            <li><Link href="/magazine?category=dispatches">Dispatches</Link></li>
            <li><Link href="/newsletter">Newsletter</Link></li>
          </ul>
        </div>

        <div className="hp-footer-col">
          <h6>Community</h6>
          <ul>
            <li><Link href="/events">Happenings</Link></li>
            <li><Link href="/journeys">Origins</Link></li>
            <li><Link href="/directory">Directory</Link></li>
            <li><Link href="/visuals">Visuals</Link></li>
            <li><Link href="/quotes">Quotes</Link></li>
          </ul>
        </div>

        <div className="hp-footer-col">
          <h6>Play</h6>
          <ul>
            <li><Link href="/games">All Games</Link></li>
            <li><Link href="/games/trivia">Culture Trivia</Link></li>
            <li><Link href="/games/who-said-it">Who Said It?</Link></li>
            <li><Link href="/pulse">Pulse</Link></li>
          </ul>
        </div>

        <div className="hp-footer-col">
          <h6>Lifestyle</h6>
          <ul>
            <li><Link href="/shop">Moveee Shop</Link></li>
            <li><Link href="/makers">Vetted Makers</Link></li>
            <li><Link href="/shop/shipping">Shipping &amp; Returns</Link></li>
            <li><Link href="/connect">Become a Member</Link></li>
            <li><Link href="/member">My Account</Link></li>
          </ul>
        </div>

        <div className="hp-footer-col">
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

      {/* Bottom strip */}
      <div className="hp-footer-bottom">
        <div>© 2026 The Moveee — Designed for the Diaspora</div>
        <div className="hp-footer-legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/cookie-policy">Cookies</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/ai-use">AI Use</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
