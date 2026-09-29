"use client";

import { useEffect, useState, useCallback } from "react";
import { shelfLabelsFor, type ShelfStatus, type SocialProof } from "@/lib/reading-tracker";

// "Add to your log" + social proof — web mirror of
// apps/mobile/src/components/community/LogEntryPanel.tsx, part of the
// "Log-First" pass (see CLAUDE.md). The shelf mechanism itself
// (Culture_Reading_Tracker) is generic across directory types — only the
// button labels vary per type (see shelfLabelsFor()). An entry type with no
// SHELF_LABELS entry (e.g. person) renders nothing from this component —
// there's no "read/watched/been" concept for a person, only saved lines
// (see SavedLines.tsx) and the follow affordance (DirectoryFollowButton.tsx).

export default function LogEntryPanel({
  directoryId,
  entryType,
  isLoggedIn,
}: {
  directoryId: number;
  entryType: string;
  isLoggedIn: boolean;
}) {
  const labels = shelfLabelsFor(entryType);

  const [status, setStatus] = useState<ShelfStatus | null>(null);
  const [proof, setProof] = useState<SocialProof | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProof = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`/api/reading/social-proof?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) setProof(await res.json());
    } catch {}
  }, [directoryId, isLoggedIn]);

  useEffect(() => {
    if (!labels) return;
    loadProof();
  }, [labels, loadProof]);

  async function setShelf(next: ShelfStatus) {
    if (saving) return;
    const prev = status;
    const clearing = next === status;
    setStatus(clearing ? null : next);
    setSaving(true);
    try {
      if (clearing) {
        await fetch(`/api/reading/shelf?directory_id=${directoryId}`, { method: "DELETE" });
      } else {
        await fetch("/api/reading/shelf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ directory_id: directoryId, status: next }),
        });
      }
      loadProof();
    } catch {
      setStatus(prev);
    }
    setSaving(false);
  }

  if (!labels) return null;

  const buttons = Object.keys(labels) as ShelfStatus[];
  const hasProof = !!proof && (proof.doneCount > 0 || proof.wantCount > 0);

  return (
    <div className="dir-log">
      {isLoggedIn && (
        <div className="dir-log-buttons">
          {buttons.map((st) => {
            const active = status === st;
            return (
              <button
                key={st}
                type="button"
                className={`dir-log-btn${active ? " dir-log-btn--active" : ""}`}
                onClick={() => setShelf(st)}
                disabled={saving}
              >
                {labels[st]}
              </button>
            );
          })}
        </div>
      )}

      {hasProof && (
        <p className="dir-log-proof">
          <strong>{proof!.doneCount}</strong> {proof!.doneCount === 1 ? "person" : "people"} you
          follow {labels.read === "Been" ? "have been" : "have logged it"}
          {proof!.wantCount > 0 && (
            <>
              {" · "}
              <strong>{proof!.wantCount}</strong> want to {labels.read === "Been" ? "go" : "read it"}
            </>
          )}
        </p>
      )}
    </div>
  );
}
