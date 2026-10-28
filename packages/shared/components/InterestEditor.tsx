"use client";

import { useState } from "react";
import { INTERESTS } from "@/lib/interest-mappings";

interface Props {
  initialInterests: string[];
}

export default function InterestEditor({ initialInterests }: Props) {
  const [selected, setSelected] = useState<string[]>(initialInterests);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");

  function toggle(slug: string) {
    setSelected(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
    setSaved(false);
  }

  async function handleSave() {
    if (selected.length < 3) { setError("Please select at least 3 interests."); return; }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
    } catch {
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="sett-interest-grid">
        {INTERESTS.map(({ slug, label, emoji }) => {
          const active = selected.includes(slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              className={`sett-interest-btn${active ? " sett-interest-btn--active" : ""}`}
            >
              <span style={{ fontSize: 16 }}>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <p className={`sett-interest-count${selected.length >= 3 ? " sett-interest-count--ok" : ""}`}>
        {selected.length} selected{selected.length < 3 ? ` — ${3 - selected.length} more needed` : " ✓"}
      </p>

      {error && (
        <p className="sett-error-msg" style={{ marginBottom: 12 }}>{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || selected.length < 3}
        className="sett-save-btn"
        style={{ opacity: saving || selected.length < 3 ? 0.6 : 1 }}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save interests"}
      </button>
    </div>
  );
}
