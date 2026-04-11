import React from "react";
import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  return (
    <footer>
      <div className="footer-top">
        <div>
          {/* Re-using the wordmark or a bold label for brand if no white logo image is available */}
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 900, marginBottom: '14px', letterSpacing: '-0.03em' }}>
            THE MOVEEE
          </h2>
          <div className="footer-brand">
            <p>Navigating the intersection of culture, lifestyle, and African heritage through curated visual stories and vetted commerce.</p>
          </div>
        </div>
        <div>
          <h5>Magazine</h5>
          <ul>
            <li><Link href="/magazine?category=culture">Culture</Link></li>
            <li><Link href="/magazine?category=interviews">Portraits</Link></li>
            <li><Link href="/magazine?category=dispatches">Dispatches</Link></li>
            <li><Link href="/magazine">The Issue Archive</Link></li>
          </ul>
        </div>
        <div>
          <h5>Lifestyle & Shop</h5>
          <ul>
            <li><Link href="/shop">Vetted Makers</Link></li>
            <li><Link href="/shop/new">New Arrivals</Link></li>
            <li><Link href="/connect">Become a Member</Link></li>
            <li><Link href="/shop/shipping">Shipping & Returns</Link></li>
          </ul>
        </div>
        <div>
          <h5>Weekly Digest</h5>
          <div className="newsletter">
            <input type="email" placeholder="EMAIL ADDRESS" />
            <button>Subscribe</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 THE MOVEEE — DESIGNED FOR THE DIASPORA</div>
        <div>
          <Link href="/privacy" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Terms</Link>
          <Link href="/contact" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
