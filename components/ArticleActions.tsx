"use client";

import { useState } from "react";
import { Share2, Bookmark, Heart } from "lucide-react";

export default function ArticleActions() {
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
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
      // user cancelled — do nothing
    }
  };

  return (
    <div className="share-row">
      <button
        className="sh-btn"
        aria-label={copied ? "Link copied!" : "Share"}
        onClick={handleShare}
        title={copied ? "Link copied!" : "Share this article"}
        style={copied ? { background: 'var(--gold)', borderColor: 'var(--gold)' } : {}}
      >
        <Share2 size={14} strokeWidth={1.5} />
      </button>

      <button
        className="sh-btn"
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
        onClick={() => setBookmarked(b => !b)}
        title={bookmarked ? "Remove bookmark" : "Bookmark this article"}
        style={bookmarked ? { background: 'var(--gold)', borderColor: 'var(--gold)' } : {}}
      >
        <Bookmark size={14} strokeWidth={1.5} fill={bookmarked ? "currentColor" : "none"} />
      </button>

      <button
        className="sh-btn"
        aria-label={liked ? "Unlike" : "Like"}
        onClick={() => setLiked(l => !l)}
        title={liked ? "Unlike this article" : "Like this article"}
        style={liked ? { background: 'var(--ochre)', borderColor: 'var(--ochre)' } : {}}
      >
        <Heart size={14} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
