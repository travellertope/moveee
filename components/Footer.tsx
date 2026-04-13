import React from "react";
import Link from "next/link";
import Image from "next/image";
import NewsletterSubscribeWidget from "@/components/NewsletterSubscribeWidget";

const Footer = () => {
  return (
    <footer>
      <div className="footer-top">
        <div className="footer-brand-wrap">
          <Link href="/">
            <img 
              src="https://mltvzlykp9yb.i.optimole.com/cb:k_0z.862/w:920/h:144/q:mauto/f:best/https://cms.themoveee.com/wp-content/uploads/2024/04/logo-1-e1713978527703.png" 
              alt="The Moveee"
              className="footer-logo"
              style={{ maxHeight: '40px', width: 'auto', marginBottom: '24px' }}
            />
          </Link>
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
          <h5>Community</h5>
          <ul>
            <li><Link href="/directory">Culture Directory</Link></li>
            <li><Link href="/quotes">Moveee Quotes</Link></li>
            <li><Link href="/connect">Become a Member</Link></li>
            <li><Link href="/member">Member Profiler</Link></li>
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
          <h5>Company</h5>
          <ul>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/cookie-policy">Cookie Policy</Link></li>
            <li><Link href="/terms">Terms of Use</Link></li>
            <li><Link href="/ai-use">AI Use Policy</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div>© 2026 THE MOVEEE — DESIGNED FOR THE DIASPORA</div>
        <div>
          <Link href="/privacy" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Privacy</Link>
          <Link href="/cookie-policy" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Cookies</Link>
          <Link href="/terms" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Terms</Link>
          <Link href="/ai-use" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>AI Use</Link>
          <Link href="/contact" style={{ color: 'var(--mute)', textDecoration: 'none', marginLeft: '14px' }}>Contact</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
