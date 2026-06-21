import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Partner Perks & Wallet — Spend It, or Cash It Out | Moveee",
  description:
    "Redeem your Culture Credits for real discounts at partner businesses, or cash them out straight to your bank account. Your Moveee Wallet tracks every credit, every step of the way.",
  alternates: { canonical: "https://themoveee.com/features/perks-wallet" },
  openGraph: {
    title: "Partner Perks & Wallet — Spend It, or Cash It Out | Moveee",
    description:
      "Redeem Culture Credits for real discounts, or convert them straight to cash.",
    url: "https://themoveee.com/features/perks-wallet",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Partner Perks & Wallet" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner Perks & Wallet — Spend It, or Cash It Out | Moveee",
    description:
      "Redeem Culture Credits for real discounts, or convert them straight to cash.",
  },
};

export default function PerksWalletPage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Partner Perks &amp; Wallet</p>
            <h1 className="fp-h1">
              Spend it, <em>or cash it out.</em>
            </h1>
            <p className="fp-subhead">
              Culture Credits aren't just points — they're real value. Redeem them for
              discounts at partner restaurants, venues and brands, or convert them straight
              to cash in your bank account.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#wallet" className="mz-btn-secondary">How the wallet works</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · QR redemption in seconds</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">QR</span>
                <span className="fp-stat-label">Redeem in person, instantly</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">£/₦/$</span>
                <span className="fp-stat-label">Cash out to your bank</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">🔒</span>
                <span className="fp-stat-label">Passkey-secured wallet</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="fp-section fp-section--white" id="wallet">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Partner Perks</p>
              <h3 className="fp-row-title">Real discounts at real places.</h3>
              <p className="fp-row-body">
                Browse perks from restaurants, venues, shops and brands across your city.
                Redeem with your Culture Credits and show a QR code at the till — some
                perks are open to everyone, others unlock at higher reputation tiers.
              </p>
              <ul className="fp-row-list">
                <li>Browse and redeem perks from local partner businesses</li>
                <li>QR-code redemption, verified in seconds in person</li>
                <li>Some perks require a minimum reputation tier to unlock</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Your Wallet</p>
              <h3 className="fp-row-title">Every credit, accounted for.</h3>
              <p className="fp-row-body">
                Your Wallet shows your full balance and a complete history of every credit
                earned and spent. When you're ready, cash out directly to your bank account
                — Moveee handles the conversion, the fee is always shown up front, never
                hidden.
              </p>
              <ul className="fp-row-list">
                <li>Full credit history — every earn and every spend, by date</li>
                <li>Cash out to your bank account, fee shown up front</li>
                <li>Passkey support for fast, secure sign-in to your wallet</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="perks-wallet"
        heading="Turn your culture into currency."
        body="Download Moveee, start earning Culture Credits, and redeem them for real discounts or cold, hard cash."
      />
    </>
  );
}
