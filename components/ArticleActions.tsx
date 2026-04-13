"use client";

import { useState, useEffect } from "react";
import { Share2, Bookmark, Heart } from "lucide-react";
import { useSession } from "next-auth/react";

interface ArticleActionsProps {
  postId: number;
}

export default function ArticleActions({ postId }: ArticleActionsProps) {
  const { data: session } = useSession();
  const [bookmarked, setBookmarked] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync state with backend on mount
  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/interactions")
        .then(res => res.json())
        .then(data => {
          if (data.liked_articles?.includes(postId)) setLiked(true);
          if (data.bookmarked_articles?.includes(postId)) setBookmarked(true);
        })
        .catch(() => {});
    }
  }, [postId, session]);

  const toggleAction = async (type: 'like' | 'bookmark') => {
    if (!session) {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
      return;
    }
    if (isSyncing) return;

    setIsSyncing(true);
    // Optimistic update
    if (type === 'like') setLiked(!liked);
    else setBookmarked(!bookmarked);

    try {
      const res = await fetch("/api/user/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, type, kind: 'article' }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        // Revert on error
        if (type === 'like') setLiked(liked);
        else setBookmarked(bookmarked);
      }
    } catch (err) {
      if (type === 'like') setLiked(liked);
      else setBookmarked(bookmarked);
    } finally {
      setIsSyncing(false);
    }
  };

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

      // Award points for sharing
      if (session) {
        fetch("/api/points/award", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "magazine_share",
            post_id: postId,
          }),
        }).catch(() => {});
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
        onClick={() => toggleAction('bookmark')}
        disabled={isSyncing}
        title={bookmarked ? "Remove bookmark" : "Bookmark this article"}
        style={bookmarked ? { background: 'var(--gold)', borderColor: 'var(--gold)' } : {}}
      >
        <Bookmark size={14} strokeWidth={1.5} fill={bookmarked ? "currentColor" : "none"} />
      </button>

      <button
        className="sh-btn"
        aria-label={liked ? "Unlike" : "Like"}
        onClick={() => toggleAction('like')}
        disabled={isSyncing}
        title={liked ? "Unlike this article" : "Like this article"}
        style={liked ? { background: 'var(--ochre)', borderColor: 'var(--ochre)' } : {}}
      >
        <Heart size={14} strokeWidth={1.5} fill={liked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
