"use client";

import { useState } from "react";

interface Props { url: string; name: string }

export default function ShareButton({ url, name }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${name} | Moveee`, url });
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  }

  return (
    <button
      onClick={handleShare}
      className={`prf-share-btn${copied ? " prf-share-btn--copied" : ""}`}
    >
      {copied ? "Link copied ✓" : "Share profile"}
    </button>
  );
}
