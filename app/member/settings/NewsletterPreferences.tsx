"use client";

import { useState, useEffect } from "react";

interface Props {
  email: string;
}

const NEWSLETTERS = [
  {
    id: "getmelit",
    name: "GetMeLit",
    desc: "Bi-weekly — the deep cultural essay, curated picks, and what's playing.",
  },
  {
    id: "culture-drop",
    name: "Culture Drop",
    desc: "Weekly — a flash of what's moving in Black culture. Fast, sharp, every Thursday.",
  },
  {
    id: "events",
    name: "Events & Experiences",
    desc: "As needed — first access to new events and exclusive chapter invites.",
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
        });
        setLoadState("ready");
      })
      .catch(() => {
        // Fall back to all-on so we don't wrongly unsubscribe anyone
        setSubscribed({ "getmelit": true, "culture-drop": true, "events": true });
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
    <div className="mem-field-list">
      {NEWSLETTERS.map((nl) => {
        const isOn = subscribed[nl.id] ?? true;
        const isSaving = saving === nl.id;
        const fb = feedback[nl.id];

        return (
          <div key={nl.id} className="mem-field mem-field--action">
            <div>
              <div className="mem-field-label">{nl.name}</div>
              <div className="mem-field-value mem-field-value--muted">{nl.desc}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {fb === "saved" && <span className="mem-fb mem-fb--ok">Saved ✓</span>}
              {fb === "error" && <span className="mem-fb mem-fb--err">Error</span>}
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
  );
}
