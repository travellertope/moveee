"use client";

import { useState, useEffect } from "react";

interface Props {
  email: string;
}

const NEWSLETTERS = [
  {
    id: "culture-drop",
    name: "Culture Drop",
    desc: "Weekly — the deep dive into culture. Essays, music, events. Every Tuesday.",
  },
  {
    id: "getmelit",
    name: "GetMeLit",
    desc: "Weekly — stories, poems, book recommendations, and opportunities for writers and readers.",
  },
  {
    id: "events",
    name: "Events & Experiences",
    desc: "As needed — first access to new events and exclusive member invites.",
  },
  {
    id: "announcements",
    name: "Announcements",
    desc: "Occasional — general site notices and operational updates from the Moveee team.",
  },
];

export default function NewsletterPreferences({ email }: Props) {
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "saved" | "error">>({});

  // Fetch real state on mount
  useEffect(() => {
    fetch("/api/newsletter/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setSubscribed(data.subscriptions ?? {
          "getmelit": true,
          "culture-drop": true,
          "events": true,
          "announcements": true,
        });
        setLoadState("ready");
      })
      .catch(() => {
        // Fall back to all-on so we don't wrongly unsubscribe anyone
        setSubscribed({ "getmelit": true, "culture-drop": true, "events": true, "announcements": true });
        setLoadState("ready");
      });
  }, [email]);

  async function toggle(id: string) {
    const newVal = !subscribed[id];
    setSaving(id);

    try {
      const res = await fetch("/api/newsletter/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptions: { ...subscribed, [id]: newVal },
        }),
      });
      if (!res.ok) throw new Error();
      setSubscribed((prev) => ({ ...prev, [id]: newVal }));
      setFeedback((prev) => ({ ...prev, [id]: "saved" }));
    } catch {
      setFeedback((prev) => ({ ...prev, [id]: "error" }));
    } finally {
      setSaving(null);
      setTimeout(() => setFeedback((prev) => { const n = { ...prev }; delete n[id]; return n; }), 2000);
    }
  }

  if (loadState === "loading") {
    return <p className="mem-field-value mem-field-value--muted">Loading preferences…</p>;
  }

  return (
    <div className="sett-nl-list">
      {NEWSLETTERS.map((nl) => {
        const isOn = subscribed[nl.id] ?? true;
        const isSaving = saving === nl.id;

        return (
          <div key={nl.id} className="sett-nl-row">
            <div className="sett-nl-info">
              <div className="sett-nl-name">{nl.name}</div>
              <div className="sett-nl-desc">{nl.desc}</div>
            </div>
            <button
              className={`sett-nl-btn${isOn ? " sett-nl-btn--subscribed" : ""}`}
              onClick={() => toggle(nl.id)}
              disabled={isSaving}
              aria-label={`${isOn ? "Unsubscribe from" : "Subscribe to"} ${nl.name}`}
            >
              {isSaving ? "…" : isOn ? "SUBSCRIBED" : "SUBSCRIBE"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
