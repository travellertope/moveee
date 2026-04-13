"use client";

import { useState } from "react";

interface Props {
  email: string;
}

const NEWSLETTERS = [
  {
    id: "cultural-digest",
    name: "The Cultural Digest",
    desc: "Our flagship weekly newsletter — events, culture, stories, and what's moving in your city.",
    frequency: "Weekly",
  },
  {
    id: "getmelit",
    name: "GetMeLit",
    desc: "A curated reading list for the culturally curious. Books, essays, and long reads worth your time.",
    frequency: "Bi-weekly",
  },
  {
    id: "events",
    name: "Events & Experiences",
    desc: "First access to new events, exclusive invites, and what's on in your chapter.",
    frequency: "As needed",
  },
];

export default function NewsletterPreferences({ email }: Props) {
  // Default all to subscribed — actual state would come from a preferences API
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({
    "cultural-digest": true,
    "getmelit": true,
    "events": true,
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(id: string) {
    const newVal = !subscribed[id];
    setSaving(id);
    setError(null);

    try {
      if (!newVal) {
        // Unsubscribing
        const res = await fetch("/api/newsletter/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, token: "member-session", campaign_id: null }),
        });
        if (!res.ok) throw new Error("Failed");
      } else {
        // Re-subscribing
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) throw new Error("Failed");
      }
      setSubscribed((prev) => ({ ...prev, [id]: newVal }));
      setSavedAt(id);
      setTimeout(() => setSavedAt(null), 2000);
    } catch {
      setError(id);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(null);
    }
  }

  const allOff = Object.values(subscribed).every((v) => !v);

  return (
    <>
      {/* Subscription toggles */}
      <section className="mem-card">
        <div className="mem-card-header">
          <div className="mem-card-label">Newsletter Subscriptions</div>
          <span className="mem-card-count">{email}</span>
        </div>

        <div className="mem-pref-list">
          {NEWSLETTERS.map((nl) => {
            const isOn = subscribed[nl.id];
            const isSaving = saving === nl.id;
            const justSaved = savedAt === nl.id;
            const hasError = error === nl.id;

            return (
              <div key={nl.id} className="mem-pref-row">
                <div className="mem-pref-info">
                  <div className="mem-pref-name">{nl.name}</div>
                  <div className="mem-pref-desc">{nl.desc}</div>
                  <div className="mem-pref-freq">{nl.frequency}</div>
                </div>
                <div className="mem-pref-action">
                  {hasError && (
                    <span className="mem-pref-status mem-pref-status--error">Error</span>
                  )}
                  {justSaved && (
                    <span className="mem-pref-status mem-pref-status--saved">Saved ✓</span>
                  )}
                  <button
                    className={`mem-toggle${isOn ? " mem-toggle--on" : ""}`}
                    onClick={() => toggle(nl.id)}
                    disabled={isSaving}
                    aria-label={`${isOn ? "Unsubscribe from" : "Subscribe to"} ${nl.name}`}
                  >
                    {isSaving ? "…" : isOn ? "Subscribed" : "Subscribe"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {allOff && (
          <p className="mem-pref-note">
            You are not subscribed to any newsletters. We&apos;ll only send you essential account emails.
          </p>
        )}
      </section>

      {/* Email address */}
      <section className="mem-card">
        <div className="mem-card-label">Email Address</div>
        <p className="mem-card-desc">
          All newsletters are sent to <strong>{email}</strong>. To change your email address, contact us.
        </p>
        <div className="mem-pref-email-row">
          <code className="mem-pref-email">{email}</code>
        </div>
      </section>
    </>
  );
}
