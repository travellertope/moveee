"use client";

import { useState } from "react";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import FeedCard from "./FeedCard";

const TYPE_FILTERS: { label: string; value: FeedItemType | "all" }[] = [
  { label: "All",        value: "all"       },
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
  const [activeType, setActiveType] = useState<FeedItemType | "all">("all");
  const [activeRegion, setActiveRegion] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState(24);

  const filtered = initialItems.filter((item) => {
    const typeMatch = activeType === "all" || item.type === activeType;
    const regionMatch =
      activeRegion === "All" ||
      (item.region?.toLowerCase() === activeRegion.toLowerCase());
    return typeMatch && regionMatch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleType = (type: FeedItemType | "all") => {
    setActiveType(type);
    setVisibleCount(24);
    if (type !== "pulse") setActiveRegion("All");
  };

  const handleRegion = (region: string) => {
    setActiveRegion(region);
    setVisibleCount(24);
  };

  const showRegions = activeType === "all" || activeType === "pulse";

  return (
    <div style={{ background: "#0d0d0d", minHeight: "60vh", paddingBottom: "4rem" }}>
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
              <FeedCard key={item.id} item={item} />
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
