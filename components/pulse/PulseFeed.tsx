"use client";

import { useState, useCallback, useMemo } from "react";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import FeedCard from "./FeedCard";
import SubmitPost from "./SubmitPost";

const TYPE_FILTERS: { label: string; value: FeedItemType | "all" }[] = [
  { label: "All",        value: "all"       },
  { label: "Community",  value: "community" },
  { label: "Pulse",      value: "pulse"     },
  { label: "Editorial",  value: "editorial" },
  { label: "Happening",  value: "happening" },
  { label: "Directory",  value: "directory" },
  { label: "Quote",      value: "quote"     },
];

const REGIONS = ["All", "Africa", "Caribbean", "Diaspora UK", "Diaspora US", "Diaspora Europe", "Global"] as const;

interface PulseFeedProps {
  initialItems: FeedItem[];
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
        background: active ? "#D4A847" : "transparent",
        color: active ? "#0d0d0d" : "#888",
        border: active ? "1px solid #D4A847" : "1px solid #2a2a2a",
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

export default function PulseFeed({ initialItems }: PulseFeedProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [activeType, setActiveType] = useState<FeedItemType | "all">("all");
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [activeTag, setActiveTag] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(24);

  // Derive available tags from actual community posts in the feed.
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach((item) => {
      if (item.type === "community" && item.communityTag) tags.add(item.communityTag);
    });
    return Array.from(tags).sort();
  }, [items]);

  const handlePosted = useCallback(
    (post: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null }) => {
      const newItem: FeedItem = {
        id: `community-${post.id}`,
        type: "community",
        title: post.text,
        slug: String(post.id),
        date: new Date().toISOString(),
        image: post.imageUrl ?? undefined,
        href: `/pulse#community-${post.id}`,
        communityAuthor: post.authorName,
        communityTag: post.tag ?? "",
        reactions: { love: 0, fire: 0, clap: 0 },
        wpId: post.id,
      };
      setItems((prev) => [newItem, ...prev]);
      setActiveType("community");
      setActiveTag(post.tag ?? "");
      setVisibleCount(24);
    },
    []
  );

  const handleTagClick = useCallback((tag: string) => {
    setActiveType("community");
    setActiveTag((prev) => (prev === tag ? "" : tag));
    setVisibleCount(24);
  }, []);

  const filtered = items.filter((item) => {
    const typeMatch = activeType === "all" || item.type === activeType;
    const regionMatch =
      activeRegion === "All" ||
      (item.region?.toLowerCase() === activeRegion.toLowerCase());
    const tagMatch =
      !activeTag ||
      (item.type === "community" && item.communityTag === activeTag);
    return typeMatch && regionMatch && tagMatch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleType = (type: FeedItemType | "all") => {
    setActiveType(type);
    setActiveTag("");
    setVisibleCount(24);
    if (type !== "pulse") setActiveRegion("All");
  };

  const handleRegion = (region: string) => {
    setActiveRegion(region);
    setVisibleCount(24);
  };

  const showRegions = activeType === "all" || activeType === "pulse";
  const showTags = availableTags.length > 0 && (activeType === "all" || activeType === "community");

  return (
    <div style={{ background: "#0d0d0d", minHeight: "60vh", paddingBottom: "4rem" }}>
      {/* Compose box */}
      <SubmitPost onPosted={handlePosted} />

      {/* Filters */}
      <div
        style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "1.25rem 1.5rem",
          position: "sticky",
          top: 0,
          background: "#0d0d0d",
          zIndex: 10,
        }}
      >
        {/* Type filters */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: showRegions ? "0.6rem" : 0 }}>
          {TYPE_FILTERS.map(({ label, value }) => (
            <FilterPill
              key={value}
              label={label}
              active={activeType === value}
              onClick={() => handleType(value)}
            />
          ))}
        </div>
        {/* Region filters — only relevant for Pulse */}
        {showRegions && (
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: showTags ? "0.6rem" : 0 }}>
            {REGIONS.map((region) => (
              <FilterPill
                key={region}
                label={region}
                active={activeRegion === region}
                onClick={() => handleRegion(region)}
              />
            ))}
          </div>
        )}

        {/* Tag filters — derived from community posts present in the feed */}
        {showTags && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", paddingTop: showRegions ? "0" : "0" }}>
            <FilterPill
              label="All tags"
              active={activeTag === ""}
              onClick={() => { setActiveTag(""); setVisibleCount(24); }}
            />
            {availableTags.map((tag) => (
              <FilterPill
                key={tag}
                label={tag}
                active={activeTag === tag}
                onClick={() => handleTagClick(tag)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div style={{ padding: "1.5rem" }}>
        {visible.length === 0 ? (
          <div style={{ color: "#555", textAlign: "center", padding: "4rem 0", fontSize: "0.9rem" }}>
            Nothing here yet — check back soon.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {visible.map((item) => (
              <FeedCard key={item.id} item={item} onTagClick={handleTagClick} />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <button
              onClick={() => setVisibleCount((n: number) => n + 24)}
              style={{
                background: "transparent",
                border: "1px solid #D4A847",
                color: "#D4A847",
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
              Load more
            </button>
          </div>
        )}
      </div>

      <style>{`
        .pulse-card:hover {
          border-color: #2e2e2e !important;
        }
      `}</style>
    </div>
  );
}
