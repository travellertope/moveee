"use client";

import { useEffect, useState, useCallback } from "react";
import { MOOD_TAGS, MOOD_LABELS, PACES, PACE_LABELS, type Pace, type BookMoodPace as BookMoodPaceData } from "@/lib/reading-tracker";

// Mood/pace tags — Phase 3 of the Reading Tracker, see
// docs/reading-tracker-plan.md §1.3/§3.4. Community-sourced (mode of every
// signed-in member's own vote), shown on a book's directory-entry page at
// the same visual weight as any other infobox metadata field — a discovery
// aid, not a headline. Aggregate chips are public (readable by anyone,
// logged in or not); the voting prompt itself only ever renders for a
// signed-in visitor.

export default function BookMoodPace({ directoryId, isLoggedIn }: { directoryId: number; isLoggedIn: boolean }) {
  const [data, setData] = useState<BookMoodPaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftMoods, setDraftMoods] = useState<string[]>([]);
  const [draftPace, setDraftPace] = useState<Pace | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reading/mood-pace?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    load();
  }, [load]);

  function startVoting() {
    setDraftMoods(data?.myVote?.moods ?? []);
    setDraftPace(data?.myVote?.pace ?? null);
    setEditing(true);
  }

  function toggleMood(mood: string) {
    setDraftMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));
  }

  async function submitVote() {
    if (!draftPace) return;
    setSaving(true);
    try {
      const res = await fetch("/api/reading/mood-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory_id: directoryId, moods: draftMoods, pace: draftPace }),
      });
      if (res.ok) setData(await res.json());
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  if (loading) return null;

  const hasAggregate = !!data && (data.moods.length > 0 || !!data.pace);

  return (
    <div className="dir-mood">
      {hasAggregate && (
        <>
          {data!.moods.length > 0 && (
            <div className="dir-wiki-infobox-row">
              <span className="dir-wiki-infobox-label">Mood</span>
              <span className="dir-mood-chips">
                {data!.moods.map((m) => (
                  <span key={m} className="dir-mood-chip">
                    {MOOD_LABELS[m as (typeof MOOD_TAGS)[number]] ?? m}
                  </span>
                ))}
              </span>
            </div>
          )}
          {data!.pace && (
            <div className="dir-wiki-infobox-row">
              <span className="dir-wiki-infobox-label">Pace</span>
              <span className="dir-wiki-infobox-value">{PACE_LABELS[data!.pace]}</span>
            </div>
          )}
        </>
      )}

      {isLoggedIn && !editing && (
        <button type="button" className="dir-mood-vote-link" onClick={startVoting}>
          {data?.myVote ? "Edit your mood/pace vote →" : "How would you describe this book? →"}
        </button>
      )}

      {isLoggedIn && editing && (
        <div className="dir-mood-form">
          <div className="dir-mood-form-label">Moods (pick as many as fit)</div>
          <div className="dir-mood-form-chips">
            {MOOD_TAGS.map((mood) => (
              <button
                key={mood}
                type="button"
                className={`dir-mood-form-chip${draftMoods.includes(mood) ? " dir-mood-form-chip--active" : ""}`}
                onClick={() => toggleMood(mood)}
              >
                {MOOD_LABELS[mood]}
              </button>
            ))}
          </div>

          <div className="dir-mood-form-label">Pace</div>
          <div className="dir-mood-form-chips">
            {PACES.map((pace) => (
              <button
                key={pace}
                type="button"
                className={`dir-mood-form-chip${draftPace === pace ? " dir-mood-form-chip--active" : ""}`}
                onClick={() => setDraftPace(pace)}
              >
                {PACE_LABELS[pace]}
              </button>
            ))}
          </div>

          <div className="dir-mood-form-actions">
            <button type="button" className="dir-mood-form-submit" disabled={!draftPace || saving} onClick={submitVote}>
              {saving ? "Saving…" : "Submit"}
            </button>
            <button type="button" className="dir-mood-form-cancel" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
