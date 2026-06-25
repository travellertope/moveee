import Link from "next/link";
import type { Metadata } from "next";
import FeatureCTA from "@/components/FeatureCTA";

export const metadata: Metadata = {
  title: "Lifestyle Shop — Style, Sourced by the Community | Moveee",
  description:
    "The Moveee Lifestyle Shop features independent makers and curated drops from across the community. Moveee Pro members get 10% off everything and early access to new releases.",
  alternates: { canonical: "https://themoveee.com/features/shop" },
  openGraph: {
    title: "Lifestyle Shop — Style, Sourced by the Community | Moveee",
    description:
      "Independent makers and curated drops — Moveee Pro members get 10% off and early access.",
    url: "https://themoveee.com/features/shop",
    siteName: "Moveee",
    type: "website",
    images: [{ url: "/og-fallback.png", width: 1200, height: 630, alt: "Moveee Lifestyle Shop" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lifestyle Shop — Style, Sourced by the Community | Moveee",
    description:
      "Independent makers and curated drops — Moveee Pro members get 10% off and early access.",
  },
};

export default function ShopFeaturePage() {
  return (
    <>
      {/* ===== HERO ===== */}
      <section className="fp-hero">
        <div className="fp-hero-inner">
          <div>
            <div className="fp-eyebrow-row">
              <Link href="/features" className="fp-back-link">← All features</Link>
            </div>
            <p className="mz-eyebrow" style={{ marginTop: 16 }}>Lifestyle Shop</p>
            <h1 className="fp-h1">
              Style, <em>sourced by the community.</em>
            </h1>
            <p className="fp-subhead">
              Independent makers and curated drops, browsable right inside the app —
              with editorial picks ("The Edit") highlighting the best of what's new.
            </p>
            <div className="fp-hero-cta">
              <Link href="/register" className="mz-btn-primary">Join Moveee</Link>
              <a href="#makers" className="mz-btn-secondary">Meet the makers</a>
            </div>
            <p className="fp-trust">Free to join · iOS &amp; Android · 10% off for Moveee Pro</p>
            <div className="fp-stat-row">
              <div className="fp-stat">
                <span className="fp-stat-num">10%</span>
                <span className="fp-stat-label">Off everything, for Moveee Pro</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">Early</span>
                <span className="fp-stat-label">Access to new drops</span>
              </div>
              <div className="fp-stat">
                <span className="fp-stat-num">✦</span>
                <span className="fp-stat-label">The Edit — curated picks</span>
              </div>
            </div>
          </div>
          <div aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-hero-photo"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ===== MAKERS / DETAIL ===== */}
      <section className="fp-section fp-section--white" id="makers">
        <div className="fp-section-inner">
          <div className="fp-row">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">Independent makers</p>
              <h3 className="fp-row-title">Every product has a maker behind it.</h3>
              <p className="fp-row-body">
                Browse by maker and see their story, their other pieces, and where they're
                based — the Shop puts a face to every product instead of an anonymous
                storefront.
              </p>
              <ul className="fp-row-list">
                <li>Maker profiles with a full product catalogue and story</li>
                <li>New, sale and low-stock badges so you know what's worth grabbing</li>
                <li>Search and filter by category, price and availability</li>
              </ul>
            </div>
          </div>

          <div className="fp-row fp-row--reverse">
            <img
              src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&q=80&auto=format&fit=crop"
              alt=""
              className="fp-row-photo"
              loading="lazy"
            />
            <div className="fp-row-text">
              <p className="fp-row-eyebrow">The Edit &amp; Moveee Pro</p>
              <h3 className="fp-row-title">Curated drops, member pricing.</h3>
              <p className="fp-row-body">
                "The Edit" is Moveee's own editorial take on the Shop — seasonal picks
                and stories on the pieces worth knowing about. Moveee Pro members get
                10% off every purchase and early access before a drop goes public.
              </p>
              <ul className="fp-row-list">
                <li>The Edit — editorial features and seasonal picks</li>
                <li>Moveee Pro — 10% off every order, automatically applied</li>
                <li>Early access windows on new drops for Moveee Pro</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FeatureCTA
        currentSlug="shop"
        heading="Shop the culture you talk about."
        body="Download Moveee to browse The Edit, discover independent makers, and unlock 10% off as a Moveee Pro member."
      />
    </>
  );
}
