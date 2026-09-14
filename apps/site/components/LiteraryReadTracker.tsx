"use client";

import { useEffect } from "react";

/**
 * Fires once on mount to count this page view against the anonymous free-read
 * quota (see literary-access.ts) — a Server Component can't set a cookie
 * during render, so tracking happens client-side, fire-and-forget. Renders
 * nothing. The page only mounts this for genuinely anonymous, unverified
 * readers on public pieces — logged-in and verified readers are unmetered.
 */
export default function LiteraryReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch("/api/literary/track-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
