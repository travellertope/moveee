"use client";

import { useState, useCallback } from "react";
import type { WpPulseStory } from "@/lib/pulse-wordpress";
import PulseCard from "./PulseCard";

const CATEGORIES = [
  { slug: "all",        label: "All" },
  { slug: "music",      label: "Music" },
  { slug: "film",       label: "Film" },
  { slug: "fashion",    label: "Fashion" },
  { slug: "art",        label: "Art" },
  { slug: "literature", label: "Literature" },
  { slug: "food",       label: "Food" },
  { slug: "activism",   label: "Activism" },
  { slug: "sports",     label: "Sports" },
  { slug: "business",   label: "Business" },
  { slug: "tech",       label: "Tech" },
] as const;

const ARMS    = ["All", "Lifestyle", "Origins", "Happenings", "Magazine"] as const;
const REGIONS = ["All", "Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"] as const;

interface PulseFeedProps {
  initialStories: WpPulseStory[];
}

export default function PulseFeed({ initialStories }: PulseFeedProps) {
  const [stories,        setStories]        = useState<WpPulseStory[]>(initialStories);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeArm,      setActiveArm]      = useState("All");
  const [activeRegion,   setActiveRegion]   = useState("All");
  const [loading,        setLoading]        = useState(false);
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(initialStories.length >= 18);

  const fetchStories = useCallback(
    async (category: string, arm: string, region: string, nextPage = 1, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(nextPage), perPage: "12" });
        if (category !== "all") params.set("category", category);
        if (arm      !== "All") params.set("arm",      arm.toLowerCase());
        if (region   !== "All") params.set("region",   region);

        const res  = await fetch(`/api/pulse/stories?${params}`);
        const json = res.ok ? await res.json() : { stories: [], hasMore: false };

        const incoming: WpPulseStory[] = json.stories ?? [];
        setStories(append ? (prev) => [...prev, ...incoming] : incoming);
        setHasMore(json.hasMore ?? incoming.length >= 12);
        setPage(nextPage);
      } catch {
        // Keep existing stories on failure.
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleCategory = (cat: string) => {
    setActiveCategory(cat);
    fetchStories(cat, activeArm, activeRegion, 1, false);
  };

  const handleArm = (arm: string) => {
    setActiveArm(arm);
    fetchStories(activeCategory, arm, activeRegion, 1, false);
  };

  const handleRegion = (region: string) => {
    setActiveRegion(region);
    fetchStories(activeCategory, activeArm, region, 1, false);
  };

  const handleLoadMore = () => {
    fetchStories(activeCategory, activeArm, activeRegion, page + 1, true);
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "60vh", paddingBottom: "4rem" }}>
      {/* ── Filter bar: category tabs left, refine selects right — single row ── */}
      <div style={{
        borderBottom: "1px solid #e0dbd1",
        position: "sticky",
        top: 0,
        background: "var(--paper)",
        zIndex: 10,
        display: "flex",
        alignItems: "stretch",
        padding: "0 1.5rem",
      }}>
        {/* Scrollable category tabs */}
        <div style={{
          display: "flex",
          gap: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
          flex: 1,
        }}>
          {CATEGORIES.map(({ slug, label }) => {
            const active = activeCategory === slug;
            return (
              <button
                key={slug}
                onClick={() => handleCategory(slug)}
                style={{
                  flex: "0 0 auto",
                  padding: "0.85rem 1.1rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid var(--ochre)" : "2px solid transparent",
                  color: active ? "var(--ink)" : "#8a7d6e",
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.7rem",
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "color 0.15s, border-color 0.15s",
                  whiteSpace: "nowrap",
                  marginBottom: "-1px",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Refine selects — pinned right */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          flexShrink: 0,
          borderLeft: "1px solid #e0dbd1",
          paddingLeft: "1.25rem",
          marginLeft: "0.5rem",
        }}>
          <select
            value={activeArm}
            onChange={(e) => handleArm(e.target.value)}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.05em",
              color: activeArm !== "All" ? "var(--ink)" : "#8a7d6e",
              background: "transparent",
              border: "1px solid " + (activeArm !== "All" ? "var(--ink)" : "#d4cfc6"),
              borderRadius: "2px",
              padding: "0.28rem 0.55rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {ARMS.map((arm) => (
              <option key={arm} value={arm}>{arm === "All" ? "Section: All" : arm}</option>
            ))}
          </select>
          <select
            value={activeRegion}
            onChange={(e) => handleRegion(e.target.value)}
            style={{
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.68rem",
              letterSpacing: "0.05em",
              color: activeRegion !== "All" ? "var(--ink)" : "#8a7d6e",
              background: "transparent",
              border: "1px solid " + (activeRegion !== "All" ? "var(--ink)" : "#d4cfc6"),
              borderRadius: "2px",
              padding: "0.28rem 0.55rem",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {REGIONS.map((region) => (
              <option key={region} value={region}>{region === "All" ? "Region: All" : region}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ padding: "1.5rem", maxWidth: "1260px", margin: "0 auto" }}>
        {stories.length === 0 && !loading ? (
          <div style={{ color: "#6b6157", textAlign: "center", padding: "4rem 0", fontSize: "0.9rem" }}>
            No stories found for this filter. Check back soon.
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}>
            {stories.map((story) => (
              <PulseCard key={story.id} story={story} />
            ))}
          </div>
        )}

        {loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
            marginTop: stories.length ? "1rem" : 0,
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                background: "#ebe1d0",
                border: "1px solid #e0dbd1",
                borderRadius: "2px",
                height: "200px",
                animation: "pulse-shimmer 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        )}

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
