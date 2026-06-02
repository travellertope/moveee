"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Profile {
  storeName: string;
  bio: string;
  city: string;
  country: string;
  instagram: string;
  twitter: string;
  website: string;
  phone: string;
  banner: string;
  avatar: string;
}

const COUNTRIES = [
  "United Kingdom","United States","Nigeria","Ghana","Canada","Australia",
  "South Africa","Jamaica","Trinidad and Tobago","Barbados","Kenya","Other",
];

export default function VendorProfilePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [form,    setForm]    = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch("/api/vendor/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setForm(d); })
      .finally(() => setLoading(false));
  }, []);

  function update(field: keyof Profile, value: string) {
    setForm((f) => f ? { ...f, [field]: value } : f);
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/vendor/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name:       form.storeName,
          shop_description: form.bio,
          store_city:       form.city,
          store_country:    form.country,
          instagram:        form.instagram,
          twitter:          form.twitter,
          store_url:        form.website,
          phone:            form.phone,
        }),
      });
      if (res.ok) {
        setSaved(true);
      } else {
        const d = await res.json();
        setError(d.error ?? "Save failed. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="vd-page">
      <div className="vd-loading" style={{ minHeight: 300, position: "static" }}>
        <div className="vd-loading-dot" />
      </div>
    </div>
  );

  if (!form) return (
    <div className="vd-page">
      <div className="vd-empty-state">
        <div className="vd-empty-title">Could not load store profile</div>
        <p className="vd-empty-desc">Please try refreshing the page.</p>
      </div>
    </div>
  );

  return (
    <div className="vd-page">
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">Your Store</div>
          <h1 className="vd-page-title">Store Profile</h1>
        </div>
        {user?.vendorSlug && (
          <Link
            href={`/makers/${user.vendorSlug}`}
            target="_blank"
            className="vd-btn-outline"
            style={{ fontSize: 12 }}
          >
            View storefront ↗
          </Link>
        )}
      </div>

      <form className="vsp-form" onSubmit={handleSubmit}>

        {/* Store identity */}
        <section className="vsp-section">
          <div className="vsp-section-title">Store identity</div>
          <div className="vsp-field-group">
            <label className="vsp-label">Store name</label>
            <input
              className="vpf-input"
              value={form.storeName}
              onChange={(e) => update("storeName", e.target.value)}
              placeholder="Your store name"
              maxLength={60}
            />
          </div>
          <div className="vsp-field-group">
            <label className="vsp-label">About your store</label>
            <textarea
              className="vpf-textarea"
              rows={5}
              value={form.bio}
              onChange={(e) => update("bio", e.target.value)}
              placeholder="Tell customers who you are and what you make."
              maxLength={800}
            />
            <div className="vsp-char-count">{form.bio.length}/800</div>
          </div>
        </section>

        {/* Location */}
        <section className="vsp-section">
          <div className="vsp-section-title">Location</div>
          <div className="vsp-row">
            <div className="vsp-field-group">
              <label className="vsp-label">City</label>
              <input
                className="vpf-input"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                placeholder="e.g. London"
              />
            </div>
            <div className="vsp-field-group">
              <label className="vsp-label">Country</label>
              <select
                className="vpf-input vsp-select"
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="">Choose…</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Contact & social */}
        <section className="vsp-section">
          <div className="vsp-section-title">Contact &amp; social</div>
          <div className="vsp-row">
            <div className="vsp-field-group">
              <label className="vsp-label">Phone (optional)</label>
              <input
                className="vpf-input"
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+44 7700 000000"
              />
            </div>
            <div className="vsp-field-group">
              <label className="vsp-label">Website</label>
              <input
                className="vpf-input"
                type="url"
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
          <div className="vsp-row">
            <div className="vsp-field-group">
              <label className="vsp-label">Instagram</label>
              <div className="vsp-input-prefix-wrap">
                <span className="vsp-input-prefix">@</span>
                <input
                  className="vpf-input vsp-input--prefixed"
                  value={form.instagram}
                  onChange={(e) => update("instagram", e.target.value.replace(/^@/, ""))}
                  placeholder="yourhandle"
                />
              </div>
            </div>
            <div className="vsp-field-group">
              <label className="vsp-label">Twitter / X</label>
              <div className="vsp-input-prefix-wrap">
                <span className="vsp-input-prefix">@</span>
                <input
                  className="vpf-input vsp-input--prefixed"
                  value={form.twitter}
                  onChange={(e) => update("twitter", e.target.value.replace(/^@/, ""))}
                  placeholder="yourhandle"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Shipping note */}
        <section className="vsp-section vsp-section--info">
          <div className="vsp-section-title">Shipping &amp; payments</div>
          <p className="vsp-info-text">
            Shipping zones, rates, and payout settings are managed through the
            WCFM vendor panel in WordPress Admin.
          </p>
          <a
            href={`${process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com"}/wp-admin/admin.php?page=wcfm-vendor-settings`}
            target="_blank"
            rel="noopener noreferrer"
            className="vd-btn-outline"
            style={{ fontSize: 12, display: "inline-flex" }}
          >
            Open shipping settings in WCFM ↗
          </a>
        </section>

        {error && <div className="vsp-error">{error}</div>}

        <div className="vsp-actions">
          <button className="vd-btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </button>
          {saved && <span className="vsp-saved-msg">✓ Profile saved</span>}
        </div>
      </form>
    </div>
  );
}
