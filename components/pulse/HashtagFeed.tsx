"use client";

import { useState, useMemo } from "react";
import type { FeedItem, FeedItemType } from "@/lib/unified-feed";
import FeedCard from "./FeedCard";

const TYPE_FILTERS: { label: string; value: FeedItemType | "all" }[] = [
  { label: "All",       value: "all"       },
  { label: "Community", value: "community" },
  { label: "Pulse",     value: "pulse"     },
  { label: "Events",    value: "happening" },
  { label: "Editorial", value: "editorial" },
];

interface HashtagFeedProps {
  initialItems: FeedItem[];
  tag: string;
}

export default function HashtagFeed({ initialItems, tag }: HashtagFeedProps) {
  const [activeType, setActiveType] = useState<FeedItemType | "all">("all");

  const filtered = useMemo(() => {
    if (activeType === "all") return initialItems;
    return initialItems.filter((item) => item.type === activeType);
  }, [initialItems, activeType]);

  return (
    <div>
      {/* Type filter chips */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #e8e2d8",
        padding: "0.65rem 1.25rem",
        display: "flex",
        gap: "0.4rem",
        flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.6rem",
          color: "#7a6f5c",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          alignSelf: "center",
          marginRight: "0.25rem",
        }}>
          Filter:
        </span>
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setActiveType(value)}
            style={{
              background: activeType === value ? "#c5491f" : "transparent",
              color: activeType === value ? "#fff" : "#3a342b",
              border: activeType === value ? "1px solid #c5491f" : "1px solid #d8d0c6",
              borderRadius: "2px",
              padding: "0.22rem 0.65rem",
              fontSize: "0.72rem",
              fontWeight: activeType === value ? 700 : 400,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{
        padding: "0.5rem 1.25rem",
        background: "#f7f5f2",
        borderBottom: "1px solid #e8e2d8",
      }}>
        <span style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.65rem",
          color: "#7a6f5c",
        }}>
          {filtered.length} {filtered.length === 1 ? "post" : "posts"}
          {activeType !== "all" ? ` · ${TYPE_FILTERS.find(f => f.value === activeType)?.label}` : ""}
        </span>
      </div>

      {/* Feed */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 1.5rem",
          color: "#7a6f5c",
          fontSize: "0.85rem",
        }}>
          <p style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", color: "#14110d" }}>
            <span style={{ color: "#c5491f" }}>#</span>{tag}
          </p>
          <p style={{ margin: 0 }}>No posts yet with #{tag}</p>
        </div>
      ) : (
        filtered.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))
      )}
    </div>
  );
}
