"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const HUB_SLUGS: Record<string, string> = {
  Music: "music", Fashion: "fashion", Art: "art", Film: "film", Food: "food",
  Sport: "sport", Travel: "travel", Ideas: "ideas", Literature: "literature",
  Design: "design", Tech: "tech",
};

const DIR_TYPE_EMOJI: Record<string, string> = {
  person: "👤", place: "🏛", food: "🍽", book: "📚", film: "🎬",
  genre: "🎵", movement: "🌊", artwork: "🎨", concept: "💡",
  fashion: "👗", "tv-series": "📺",
};

interface DirectoryEntry {
  id: number;
  title: string;
  slug: string;
  type: string;
  reviewCount: number;
}

export default function FeedRightSidebar() {
  const [trending, setTrending] = useState<DirectoryEntry[]>([]);
  const [trendingLabel, setTrendingLabel] = useState("Trending Now");

  useEffect(() => {
    fetch("/api/directory/browse?sort=trending&per_page=3")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const entries = data?.entries ?? [];
        if (entries.length > 0) { setTrending(entries); return; }
        return fetch("/api/directory/browse?sort=recent&per_page=3")
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => {
            setTrending(d?.entries ?? []);
            setTrendingLabel("New in the Directory");
          });
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {trending.length > 0 && (
        <div className="pf-sidebar-section">
          <div className="pf-section-header">
            <div className="pf-section-title-row">
              <span className="pf-section-icon">🔥</span>
              <h3 className="pf-section-title">{trendingLabel}</h3>
            </div>
          </div>
          {trending.map((entry) => (
            <Link key={entry.id} href={`/directory/${entry.slug}`} className="pf-trending-card">
              <div className="pf-trending-emoji">{DIR_TYPE_EMOJI[entry.type] ?? "✦"}</div>
              <div style={{ minWidth: 0 }}>
                <p className="pf-trending-name">{entry.title}</p>
                {entry.reviewCount > 0 && (
                  <p className="pf-trending-meta">{entry.reviewCount} post{entry.reviewCount !== 1 ? "s" : ""}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="pf-sidebar-section">
        <div className="pf-section-header">
          <div className="pf-section-title-row">
            <h3 className="pf-section-title">Explore Hubs</h3>
          </div>
          <Link href="/hub" className="pf-section-see-all">See all</Link>
        </div>
        <div className="pf-hub-chips">
          {Object.entries(HUB_SLUGS).map(([name, slug]) => (
            <Link key={slug} href={`/hub/${slug}`} className="pf-hub-chip">
              #{name}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid var(--rule, #e8e2d8)" }}>
        <p style={{ margin: 0, fontSize: "0.68rem", color: "var(--mute)", lineHeight: 1.7 }}>
          © {new Date().getFullYear()} The Moveee. All Rights Reserved.
          <br />
          <Link href="https://themoveee.com/legal/terms" style={{ color: "inherit" }}>Terms</Link>
          {" · "}
          <Link href="https://themoveee.com/legal/privacy" style={{ color: "inherit" }}>Privacy</Link>
        </p>
      </div>
    </>
  );
}
