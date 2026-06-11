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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
        {INTERESTS.map(({ slug, label, emoji }) => {
          const active = selected.includes(slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 12px",
                border: active ? "2px solid #14110d" : "2px solid #d4cbbf",
                borderRadius: 4,
                background: active ? "rgba(20,17,13,.05)" : "#fff",
                cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
                fontFamily: "inherit",
                textAlign: "left",
                boxShadow: active ? "0 0 0 2px #14110d" : "none",
              }}
            >
              <span style={{ fontSize: 18 }}>{emoji}</span>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: "#14110d", lineHeight: 1.3 }}>{label}</span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 12, color: selected.length >= 3 ? "#2e7d32" : "#7a6f5c", marginBottom: 12 }}>
        {selected.length} selected{selected.length < 3 ? ` — ${3 - selected.length} more needed` : " ✓"}
      </p>

      {error && (
        <p style={{ fontSize: 13, color: "#c0392b", marginBottom: 12 }}>{error}</p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || selected.length < 3}
        className="mem-field-btn"
        style={{ opacity: saving || selected.length < 3 ? 0.6 : 1 }}
      >
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save interests"}
      </button>
    </div>
  );
}
