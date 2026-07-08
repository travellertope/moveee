"use client";

import { useState, useEffect } from "react";

// Mirrors Culture_Notifications::TYPES in class-culture-notifications.php (minus
// 'system', which is always-on and not shown here). Keep these in sync.
const NOTIFICATION_TYPES = [
  { id: "credit_earned",     name: "Credits Earned" },
  { id: "badge_unlocked",    name: "Badge Unlocked" },
  { id: "perk_expiring",     name: "Perk Expiring Soon" },
  { id: "perk_redeemed",     name: "Perk Redeemed" },
  { id: "cashout_approved",  name: "Cash Out Approved" },
  { id: "cashout_rejected",  name: "Cash Out Rejected" },
  { id: "escrow_released",   name: "Credits Released" },
  { id: "comment_received",  name: "New Comment" },
  { id: "post_validated",    name: "Post Reached Threshold" },
  { id: "referral_received", name: "Friend Joined" },
  { id: "mention",           name: "You Were Mentioned" },
  { id: "new_follower",      name: "New Follower" },
  { id: "new_follower_post", name: "New Post From Someone You Follow" },
  { id: "event_rsvp",        name: "Event RSVP" },
  { id: "hub_mod_appointed",  name: "Hub Mod Appointed" },
  { id: "hub_post_removed",   name: "Hub Post Removed" },
  { id: "hub_member_removed", name: "Removed From Hub" },
];

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, "saved" | "error">>({});

  useEffect(() => {
    fetch("/api/notifications/preferences", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setPrefs(data ?? {});
        setLoadState("ready");
      })
      .catch(() => setLoadState("error"));
  }, []);

  async function toggle(id: string) {
    const newVal = !(prefs[id] ?? true);
    setSaving(id);

    try {
      const next = { ...prefs, [id]: newVal };
      const res = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: next }),
      });
      if (!res.ok) throw new Error();
      setPrefs(next);
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
  if (loadState === "error") {
    return <p className="mem-field-value mem-field-value--muted">Couldn&apos;t load preferences. Try refreshing.</p>;
  }

  return (
    <div className="mem-field-list">
      {NOTIFICATION_TYPES.map((t) => {
        const isOn = prefs[t.id] ?? true;
        const isSaving = saving === t.id;
        const fb = feedback[t.id];

        return (
          <div key={t.id} className="mem-field mem-field--action">
            <div>
              <div className="mem-field-label">{t.name}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {fb === "saved" && <span className="mem-fb mem-fb--ok">Saved ✓</span>}
              {fb === "error" && <span className="mem-fb mem-fb--err">Error</span>}
              <button
                className={`mem-toggle${isOn ? " mem-toggle--on" : ""}`}
                onClick={() => toggle(t.id)}
                disabled={isSaving}
                aria-label={`${isOn ? "Disable" : "Enable"} ${t.name} notifications`}
              >
                {isSaving ? "…" : isOn ? "On" : "Off"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
