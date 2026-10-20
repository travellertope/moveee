"use client";

import { useEffect, useState, useCallback } from "react";
import type { SavedLine } from "@/lib/reading-tracker";

// Lines saved from this entry — web mirror of
// apps/mobile/src/components/community/SavedLines.tsx. A short quote a
// member attaches to any culture_directory entry (book, person, talk),
// independent of shelf status — a Person entry has no "read/watched"
// concept but can still have lines saved from it. Public read, owner-only
// delete.

export default function SavedLines({
  directoryId,
  isLoggedIn,
}: {
  directoryId: number;
  isLoggedIn: boolean;
}) {
  const [lines, setLines] = useState<SavedLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading/saved-lines?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLines(data.lines ?? data ?? []);
      }
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    const text = draft.trim();
    if (!text || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reading/saved-lines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, line_text: text }),
      });
      if (res.ok) {
        setDraft("");
        setComposing(false);
        load();
      }
    } catch {}
    setSaving(false);
  }

  async function remove(id: number) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/reading/saved-lines/${id}`, { method: "DELETE" });
    } catch {
      load();
    }
  }

  if (loading) return null;

  return (
    <div className="dir-lines">
      <h2 className="dir-wiki-section-heading" style={{ marginBottom: 0 }}>Lines saved from this</h2>

      {lines.length === 0 && !composing && (
        <p className="dir-lines-empty">No lines saved yet.</p>
      )}

      {lines.length > 0 && (
        <ul className="dir-lines-list">
          {lines.map((line) => (
            <li key={line.id} className="dir-lines-item">
              <p className="dir-lines-text">&ldquo;{line.lineText}&rdquo;</p>
              <div className="dir-lines-meta">
                <span className="dir-lines-author">— {line.authorName}</span>
                {line.isMine && (
                  <button type="button" className="dir-lines-delete" onClick={() => remove(line.id)}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isLoggedIn && !composing && (
        <button type="button" className="dir-lines-add" onClick={() => setComposing(true)}>
          + Save a line from this
        </button>
      )}

      {isLoggedIn && composing && (
        <div className="dir-lines-form">
          <textarea
            className="dir-lines-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            placeholder="Paste or type the line…"
            rows={3}
          />
          <div className="dir-lines-form-actions">
            <button type="button" className="dir-lines-submit" disabled={!draft.trim() || saving} onClick={submit}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="dir-lines-cancel" onClick={() => { setComposing(false); setDraft(""); }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
