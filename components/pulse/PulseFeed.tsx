"use client";

import { useState, useCallback } from "react";
import type { WpPulseStory } from "@/lib/pulse-wordpress";
import PulseCard from "./PulseCard";

const ARMS = ["All", "Lifestyle", "Origins", "Happenings", "Magazine"] as const;
const REGIONS = ["All", "Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"] as const;

interface PulseFeedProps {
  initialStories: WpPulseStory[];
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--paper)" : "#6b6157",
        border: active ? "1px solid var(--ink)" : "1px solid #d4cfc6",
        borderRadius: "2px",
        padding: "0.35rem 0.85rem",
        fontSize: "0.72rem",
        fontWeight: active ? 700 : 500,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export default function PulseFeed({ initialStories }: PulseFeedProps) {
  const [stories, setStories] = useState<WpPulseStory[]>(initialStories);
  const [activeArm, setActiveArm] = useState<string>("All");
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialStories.length >= 12);

  const fetchStories = useCallback(
    async (arm: string, region: string, nextPage = 1, append = false) => {
      setLoading(true);
      try {
        const wpBase = process.env.NEXT_PUBLIC_WP_URL ?? "";
        let url = `${wpBase}/wp-json/wp/v2/pulse-stories?per_page=12&page=${nextPage}&orderby=date&order=desc&_embed=1`;
        if (arm !== "All") url += `&pulse_arm=${encodeURIComponent(arm.toLowerCase())}`;
        if (region !== "All") url += `&pulse_region=${encodeURIComponent(region)}`;

        const res = await fetch(url);
        const data: WpPulseStory[] = res.ok ? await res.json() : [];

        setStories(append ? (prev) => [...prev, ...data] : data);
        setHasMore(data.length >= 12);
        setPage(nextPage);
      } catch {
        // Keep existing stories on failure.
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleArm = (arm: string) => {
    setActiveArm(arm);
    fetchStories(arm, activeRegion, 1, false);
  };

  const handleRegion = (region: string) => {
    setActiveRegion(region);
    fetchStories(activeArm, region, 1, false);
  };

  const handleLoadMore = () => {
    fetchStories(activeArm, activeRegion, page + 1, true);
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "60vh", paddingBottom: "4rem" }}>
      {/* Filters */}
      <div
        style={{
          borderBottom: "1px solid #e0dbd1",
          padding: "1.25rem 1.5rem",
          position: "sticky",
          top: 0,
          background: "var(--paper)",
          zIndex: 10,
        }}
      >
        {/* Arm filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
          {ARMS.map((arm) => (
            <FilterPill
              key={arm}
              label={arm}
              active={activeArm === arm}
              onClick={() => handleArm(arm)}
            />
          ))}
        </div>
        {/* Region filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {REGIONS.map((region) => (
            <FilterPill
              key={region}
              label={region}
              active={activeRegion === region}
              onClick={() => handleRegion(region)}
            />
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding: "1.5rem", maxWidth: "1260px", margin: "0 auto" }}>
        {stories.length === 0 && !loading ? (
          <div style={{ color: "#6b6157", textAlign: "center", padding: "4rem 0", fontSize: "0.9rem" }}>
            No stories found for this filter. Check back soon.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {stories.map((story) => (
              <PulseCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
              marginTop: stories.length ? "1rem" : 0,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "#ebe1d0",
                  border: "1px solid #e0dbd1",
                  borderRadius: "2px",
                  height: "200px",
                  animation: "pulse-shimmer 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && stories.length > 0 && (
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <button
              onClick={handleLoadMore}
              style={{
                background: "transparent",
                border: "1px solid var(--ink)",
                color: "var(--ink)",
                padding: "0.65rem 2rem",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "2px",
                transition: "all 0.15s",
              }}
            >
              Load more stories
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse-shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .pulse-card:hover {
          border-color: #c4bdb3 !important;
          box-shadow: 0 2px 8px rgba(20, 17, 13, 0.06);
        }
      `}</style>
    </div>
  );
}
