"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface FinishReadingProps {
  postId: number;
  /** Article reading time in minutes — used to calculate the minimum dwell time */
  readingTime?: number;
}

export default function FinishReading({ postId, readingTime = 5 }: FinishReadingProps) {
  const { data: session } = useSession();
  const [awarded, setAwarded] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const awardFired = useRef(false);
  const timeOnPage = useRef(0);

  // Don't re-fire if already awarded in this browser session
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(`read_complete_${postId}`)) {
      setAwarded(true);
      awardFired.current = true;
    }
  }, [postId]);

  useEffect(() => {
    if (!session?.user || awardFired.current) return;

    // Minimum time: 50% of reading time, at least 30 seconds
    const minSeconds = Math.max(30, readingTime * 60 * 0.5);

    const checkAndAward = async () => {
      if (awardFired.current) return;

      // Scroll progress: how far down the page has the user scrolled
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const scrollPct = scrollable > 0 ? doc.scrollTop / scrollable : 0;

      if (scrollPct >= 0.85 && timeOnPage.current >= minSeconds) {
        awardFired.current = true;
        try {
          const res = await fetch("/api/articles/read-complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId }),
          });
          const data = await res.json();
          setCreditsEarned(data.credits_earned ?? 0);
          localStorage.setItem(`read_complete_${postId}`, "true");
        } catch {
          // fail silently — don't distract the reader
        }
        setAwarded(true);
      }
    };

    const interval = setInterval(() => {
      timeOnPage.current += 1;
      checkAndAward();
    }, 1000);

    return () => clearInterval(interval);
  }, [session, postId, readingTime]);

  if (!session || !awarded) return null;

  return (
    <div style={{
      margin: "60px 0",
      padding: "32px 40px",
      background: "rgba(189, 163, 121, 0.08)",
      border: "1px solid rgba(189, 163, 121, 0.2)",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
    }}>
      <CheckCircle2 size={32} style={{ color: "var(--ochre)", flexShrink: 0 }} />
      <div>
        <p style={{
          margin: "0 0 4px 0",
          fontFamily: "var(--font-newsreader)",
          fontSize: "20px",
          fontStyle: "italic",
          color: "var(--ink)",
        }}>
          Article complete!
        </p>
        <p style={{ margin: 0, fontSize: "13px", color: "var(--mute)" }}>
          {creditsEarned > 0
            ? `+ ${creditsEarned} Culture Points earned`
            : "Already credited — thanks for reading!"}
        </p>
      </div>
    </div>
  );
}
