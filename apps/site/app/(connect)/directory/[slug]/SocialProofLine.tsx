"use client";

import { useEffect, useState, useCallback } from "react";
import type { SocialProof } from "@/lib/reading-tracker";

// "N people you follow have logged this" — split out of the old, now-deleted
// LogEntryPanel.tsx during the SDK 57 merge, since EntryLogControl.tsx
// (main's generalized shelf/rating control) has no equivalent of this line
// and Culture_Reading_Tracker::get_social_proof() has no other web caller.
// Deliberately its own small component rather than folded back into
// EntryLogControl — that component is mirrored 1:1 with the mobile version
// and shouldn't diverge just to grow a Log-First-only feature onto it.
// Reuses the pre-existing .dir-log-proof rule in directory.css.

export default function SocialProofLine({
  directoryId,
  isLoggedIn,
}: {
  directoryId: number;
  isLoggedIn: boolean;
}) {
  const [proof, setProof] = useState<SocialProof | null>(null);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(`/api/reading/social-proof?directory_id=${directoryId}`, { cache: "no-store" });
      if (res.ok) setProof(await res.json());
    } catch {}
  }, [directoryId, isLoggedIn]);

  useEffect(() => {
    load();
  }, [load]);

  if (!proof || (proof.doneCount === 0 && proof.wantCount === 0)) return null;

  return (
    <p className="dir-log-proof">
      <strong>{proof.doneCount}</strong> {proof.doneCount === 1 ? "person" : "people"} you follow have logged this
      {proof.wantCount > 0 && (
        <>
          {" · "}
          <strong>{proof.wantCount}</strong> want to
        </>
      )}
    </p>
  );
}
