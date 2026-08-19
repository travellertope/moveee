"use client";

import { useState } from "react";

// Floating "Share this story" pill (desktop) / icon-only circle (mobile),
// bottom-left — sits opposite ArticleToc's bottom-right FAB. Deliberately a
// separate, minimal share handler rather than reusing ArticleActions' —
// that one is wired into the like/bookmark sync flow and awards
// magazine_share points; this is a lighter-weight, always-visible nudge with
// no auth gate, matching the mockup's standalone pill.
export default function ArticleShareFab() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    const title = document.title;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled — no-op
    }
  };

  return (
    <button
      type="button"
      className="ar-share-fab"
      onClick={handleShare}
      aria-label={copied ? "Link copied!" : "Share this story"}
      title={copied ? "Link copied!" : "Share this story"}
    >
      <span>{copied ? "Link copied!" : "Share this story"}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
    </button>
  );
}
