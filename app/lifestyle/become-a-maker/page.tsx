"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./become-a-maker.css";

const CATEGORIES = [
  "Fashion & Apparel",
  "Art & Prints",
  "Jewellery & Accessories",
  "Beauty & Wellness",
  "Books & Zines",
  "Music & Audio",
  "Home & Living",
  "Food & Drink",
  "Digital Goods",
  "Craft & Handmade",
  "Photography",
  "Other",
];

const COUNTRIES = [
  "United Kingdom", "United States", "Nigeria", "Ghana",
  "Canada", "Australia", "South Africa", "Jamaica",
  "Trinidad and Tobago", "Barbados", "Kenya", "Other",
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type Step = "intro" | "form" | "success";

export default function BecomeAMakerPage() {
  const { data: session, status, update: updateSession } = useSession();
  const user    = session?.user as any;
  const router  = useRouter();

  const [step,       setStep]       = useState<Step>("intro");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const [storeName,  setStoreName]  = useState("");
  const [storeUrl,   setStoreUrl]   = useState("");
  const [urlEdited,  setUrlEdited]  = useState(false);
  const [bio,        setBio]        = useState("");
  const [country,    setCountry]    = useState("");
  const [category,   setCategory]   = useState("");
  const [instagram,  setInstagram]  = useState("");
  const [website,    setWebsite]    = useState("");

  // Auto-generate URL slug from store name unless user has manually edited it
  useEffect(() => {
    if (!urlEdited && storeName) setStoreUrl(slugify(storeName));
  }, [storeName, urlEdited]);

  // Already a vendor — send straight to dashboard
  useEffect(() => {
    if (status === "authenticated" && user?.isVendor) {
      router.replace("/vendor/dashboard");
    }
  }, [status, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeName, storeUrl, bio, country, category, instagram, website }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      // Refresh the session so isVendor / vendorSlug are set on next navigation
      await updateSession();
      setStep("success");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="bam-page">
        <div className="vd-loading" style={{ minHeight: 300, position: "static" }}>
          <div className="vd-loading-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="bam-page">
      {/* Hero */}
      <section className="bam-hero">
        <div className="bam-hero-inner">
          <p className="bam-eyebrow">Moveee Lifestyle · Become a Maker</p>
          <h1 className="bam-headline">Sell your work to<br />a culture-first community.</h1>
          <p className="bam-lede">
            Moveee is where Black and diaspora creatives earn. List your products,
            reach an audience that already cares, and keep the majority of every sale.
          </p>
        </div>
      </section>

      {/* Why section */}
      {step === "intro" && (
        <section className="bam-why">
          <div className="bam-why-inner">
            <div className="bam-why-grid">
              <div className="bam-why-card">
                <div className="bam-why-icon">✦</div>
                <h3>Culture-aligned audience</h3>
                <p>Your products sit alongside editorial, events, and community — reaching people already invested in Black creativity.</p>
              </div>
              <div className="bam-why-card">
                <div className="bam-why-icon">◈</div>
                <h3>Your own storefront</h3>
                <p>A dedicated maker page on Moveee, with your story, your products, and links to your editorial coverage.</p>
              </div>
              <div className="bam-why-card">
                <div className="bam-why-icon">⬡</div>
                <h3>Full dashboard control</h3>
                <p>Manage products, fulfil orders, track earnings, and update your store — all from your Moveee dashboard.</p>
              </div>
              <div className="bam-why-card">
                <div className="bam-why-icon">◎</div>
                <h3>One account, everything</h3>
                <p>Your existing Moveee membership becomes your vendor account. No new login, no separate portal.</p>
              </div>
            </div>

            <div className="bam-cta-row">
              {status !== "authenticated" ? (
                <>
                  <button
                    className="bam-btn-primary"
                    onClick={() => signIn(undefined, { callbackUrl: "/lifestyle/become-a-maker" })}
                  >
                    Sign in to apply
                  </button>
                  <Link href="/register?callbackUrl=/lifestyle/become-a-maker" className="bam-btn-outline">
                    Create a free account →
                  </Link>
                </>
              ) : (
                <button className="bam-btn-primary" onClick={() => setStep("form")}>
                  Set up your store →
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Application form */}
      {step === "form" && status === "authenticated" && (
        <section className="bam-form-section">
          <div className="bam-form-wrap">
            <div className="bam-form-header">
              <h2 className="bam-form-title">Set up your store</h2>
              <p className="bam-form-sub">You can edit all of these from your dashboard later.</p>
            </div>

            <form className="bam-form" onSubmit={handleSubmit}>
              <div className="bam-field-group">
                <div className="bam-field-label">Store name <span className="bam-required">*</span></div>
                <input
                  className="bam-input"
                  type="text"
                  placeholder="e.g. House of Ade, Studio Olusegun"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  maxLength={60}
                />
              </div>

              <div className="bam-field-group">
                <div className="bam-field-label">
                  Store URL <span className="bam-required">*</span>
                  <span className="bam-field-hint">moveee.com/makers/<strong>{storeUrl || "your-store"}</strong></span>
                </div>
                <input
                  className="bam-input"
                  type="text"
                  placeholder="your-store-url"
                  value={storeUrl}
                  onChange={(e) => { setStoreUrl(slugify(e.target.value)); setUrlEdited(true); }}
                  required
                  pattern="[a-z0-9-]+"
                  maxLength={50}
                />
              </div>

              <div className="bam-field-row">
                <div className="bam-field-group">
                  <div className="bam-field-label">Category</div>
                  <select className="bam-input bam-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Choose a category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="bam-field-group">
                  <div className="bam-field-label">Country</div>
                  <select className="bam-input bam-select" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="">Choose…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="bam-field-group">
                <div className="bam-field-label">About your store</div>
                <textarea
                  className="bam-input bam-textarea"
                  placeholder="Tell customers who you are, what you make, and why it matters."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={600}
                />
                <div className="bam-char-count">{bio.length}/600</div>
              </div>

              <div className="bam-field-row">
                <div className="bam-field-group">
                  <div className="bam-field-label">Instagram handle</div>
                  <div className="bam-input-prefix-wrap">
                    <span className="bam-input-prefix">@</span>
                    <input
                      className="bam-input bam-input--prefixed"
                      type="text"
                      placeholder="yourhandle"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                    />
                  </div>
                </div>
                <div className="bam-field-group">
                  <div className="bam-field-label">Website</div>
                  <input
                    className="bam-input"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>

              {error && <div className="bam-error">{error}</div>}

              <div className="bam-form-actions">
                <button className="bam-btn-primary" type="submit" disabled={submitting || !storeName || !storeUrl}>
                  {submitting ? "Setting up your store…" : "Open my store →"}
                </button>
                <button type="button" className="bam-btn-ghost" onClick={() => setStep("intro")}>
                  Back
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Success */}
      {step === "success" && (
        <section className="bam-success-section">
          <div className="bam-success-wrap">
            <div className="bam-success-icon">✦</div>
            <h2 className="bam-success-title">Your store is live.</h2>
            <p className="bam-success-body">
              Welcome to Moveee Lifestyle. Your maker page and dashboard are ready —
              add your first product and start selling.
            </p>
            <div className="bam-success-actions">
              <Link href="/vendor/products/new" className="bam-btn-primary">
                Add your first product →
              </Link>
              <Link href="/vendor/dashboard" className="bam-btn-outline">
                Go to dashboard
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {step !== "success" && (
        <section className="bam-faq">
          <div className="bam-faq-inner">
            <h2 className="bam-faq-title">Common questions</h2>
            <div className="bam-faq-grid">
              {[
                { q: "How much does it cost?", a: "Listing products is free. Moveee takes a small commission on each sale — you'll see the exact rate in your analytics dashboard." },
                { q: "Do I need a Connect Pro membership?", a: "No. Any Moveee member can open a store. Connect Pro members get early visibility boosts and promotional perks." },
                { q: "What can I sell?", a: "Physical goods, digital downloads, made-to-order pieces, and art prints — anything that fits Moveee's culture-forward ethos." },
                { q: "How do I get paid?", a: "Earnings are held in your WCFM wallet and paid out on request. UK, US, NG, GH and more currencies supported." },
              ].map(({ q, a }) => (
                <div key={q} className="bam-faq-item">
                  <div className="bam-faq-q">{q}</div>
                  <div className="bam-faq-a">{a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
