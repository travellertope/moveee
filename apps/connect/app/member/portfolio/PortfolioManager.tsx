"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CommunityPost {
  id: number;
  slug: string;
  text: string;
  image_url: string;
  template_type: string;
  tag: string;
}

interface PinnedPost extends CommunityPost {}

const TASTE_MAKER_THRESHOLD = 500;

interface Props { reputation: number; username: string }

export default function PortfolioManager({ reputation, username }: Props) {
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);
  const [myPosts, setMyPosts] = useState<CommunityPost[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pinning, setPinning] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unlocked = reputation >= TASTE_MAKER_THRESHOLD;

  useEffect(() => {
    fetch("/api/user/portfolio")
      .then(r => r.ok ? r.json() : { pinned_posts_data: [] })
      .then(d => {
        setPinnedPosts(d.pinned_posts_data ?? []);
      })
      .catch(() => { setPinnedPosts([]); })
      .finally(() => setLoading(false));
  }, []);

  function openPicker() {
    setShowPicker(true);
    if (username) {
      fetch(`/api/connect/${username}/posts?per_page=50&template=project`)
        .then(r => r.ok ? r.json() : { posts: [] })
        .then(d => setMyPosts(Array.isArray(d.posts) ? d.posts : []))
        .catch(() => setMyPosts([]));
    }
  }

  async function togglePin(postId: number, pinned: boolean) {
    setPinning(postId);
    setError("");
    try {
      const res = await fetch("/api/user/portfolio/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, pinned }),
      });
      if (!res.ok) throw new Error("Could not update pin.");
      if (pinned) {
        const post = myPosts.find(p => p.id === postId);
        if (post) setPinnedPosts(prev => [...prev, post]);
      } else {
        setPinnedPosts(prev => prev.filter(p => p.id !== postId));
      }
    } catch (e: any) {
      setError(e.message ?? "Could not update pin.");
    }
    setPinning(null);
  }

  if (!unlocked) {
    return (
      <section className="acct-card">
        <div className="acct-card-header">
          <span className="acct-card-title">Portfolio</span>
        </div>
        <p className="pf-locked-note">
          The public portfolio tab unlocks at <strong>Taste Maker</strong> status (500 points).
          You currently have <strong>{reputation}</strong> points.
          Keep contributing to the community to unlock it.
        </p>
        <Link href="/post/new?template=project" className="pf-btn pf-add-btn" style={{ display: "inline-block", marginTop: 12 }}>
          🎨 Post a Project
        </Link>
      </section>
    );
  }

  return (
    <section className="acct-card">
      <div className="acct-card-header">
        <span className="acct-card-title">Portfolio</span>
        <Link href="/post/new?template=project" className="pf-btn pf-add-btn" style={{ marginLeft: "auto" }}>
          🎨 Post a Project
        </Link>
      </div>

      {username && (
        <p className="pf-locked-note" style={{ marginBottom: 16 }}>
          Public portfolio: <a href={`/connect/${username}`} style={{ color: "var(--ochre)" }}>/connect/{username}</a>
        </p>
      )}

      {error && <p className="pf-status--error">{error}</p>}

      {loading ? (
        <p style={{ fontSize: "0.82rem", color: "var(--mute)" }}>Loading…</p>
      ) : (
        <>
          <div style={{ marginBottom: 24 }}>
            <p className="pf-section-label">Pinned Projects</p>
            {pinnedPosts.length === 0 ? (
              <p className="pf-locked-note">
                No pinned projects yet. Post a Project and it will appear here automatically.
              </p>
            ) : (
              pinnedPosts.map(post => (
                <div key={post.id} className="pf-pin-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="pf-pin-tag">{post.tag || post.template_type}</p>
                    <p className="pf-pin-text">{post.text}</p>
                  </div>
                  <button onClick={() => togglePin(post.id, false)} disabled={pinning === post.id} className="pf-btn pf-btn--danger">
                    Unpin
                  </button>
                </div>
              ))
            )}
            <button onClick={openPicker} className="pf-btn" style={{ marginTop: 8 }}>+ Pin an older project</button>
          </div>

          {showPicker && (
            <div style={{ marginBottom: 24, borderTop: "1px solid var(--rule)", paddingTop: 16 }}>
              <p className="pf-section-label">Choose a Project to Pin</p>
              {myPosts.length === 0 ? (
                <p className="pf-locked-note">No project posts found.</p>
              ) : (
                myPosts
                  .filter(p => !pinnedPosts.some(pp => pp.id === p.id))
                  .map(post => (
                    <div key={post.id} className="pf-pin-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="pf-pin-tag">{post.tag || post.template_type}</p>
                        <p className="pf-pin-text">{post.text}</p>
                      </div>
                      <button onClick={() => togglePin(post.id, true)} disabled={pinning === post.id} className="pf-btn">
                        Pin
                      </button>
                    </div>
                  ))
              )}
              <button onClick={() => setShowPicker(false)} className="pf-btn pf-add-btn">Close</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
