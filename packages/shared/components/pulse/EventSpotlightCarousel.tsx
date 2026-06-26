"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { FeedItem } from "@/lib/unified-feed";

const HappeningDetailModal = dynamic(() => import("./HappeningDetailModal"), { ssr: false });
const CommunityDetailModal = dynamic(() => import("./CommunityDetailModal"), { ssr: false });

const CATEGORY_COLORS: Record<string, string> = {
  music: "#C5491F",
  nightlife: "#7B1FA2",
  food: "#B38238",
  film: "#1976D2",
  art: "#6B48A8",
  literature: "#78350F",
  community: "#2D6A4F",
  performance: "#00695C",
  tech: "#3A342B",
};

function categoryColor(category?: string): string {
  if (!category) return "var(--mute, #7a6f5c)";
  const lower = category.toLowerCase();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (lower.includes(key)) return CATEGORY_COLORS[key];
  }
  return "var(--mute, #7a6f5c)";
}

function formatEventDate(dateStr?: string): { date: string; time: string } {
  if (!dateStr) return { date: "", time: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  return { date, time };
}

function SpotlightCard({ item, onOpen }: { item: FeedItem; onOpen: () => void }) {
  const { date, time } = formatEventDate(item.eventDate || item.date);
  const venue = item.venueAddress || item.location || "";
  const isCommunity = item.type === "community";
  const isFree = !item.admission || /^free$/i.test(item.admission.trim());

  return (
    <div
      onClick={onOpen}
      style={{
        width: 236,
        background: "var(--paper, #ffffff)",
        borderRadius: 12,
        boxShadow: "0 4px 20px -2px rgba(20,17,13,0.08)",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        scrollSnapAlign: "start",
      }}
    >
      {item.isFeatured && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: "var(--gold, #b38238)", zIndex: 1 }} />
      )}
      <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: categoryColor(item.eventCategory) }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--mute, #7a6f5c)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {item.eventCategory || "Event"}
          </span>
        </div>
        {item.isFeatured && <span style={{ color: "var(--gold, #b38238)", fontSize: 12 }}>★</span>}
      </div>
      <div style={{ padding: "0 12px", display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 700, color: "var(--ochre, #c5491f)", textTransform: "uppercase" }}>
          {date}
        </span>
        {time && <span style={{ fontSize: 11, color: "var(--mute, #7a6f5c)" }}>{time}</span>}
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", flex: 1, marginTop: 6 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink, #14110d)",
            lineHeight: 1.3,
            minHeight: 44,
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.title}
        </h3>
        {venue && (
          <span style={{ fontSize: 12, color: "var(--mute, #7a6f5c)", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            📍 {venue}
          </span>
        )}
      </div>
      <div style={{ margin: "10px 12px 12px", paddingTop: 8, borderTop: "1px solid var(--rule, #e8e2d8)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: isFree ? 400 : 700, color: isFree ? "var(--ink-soft, #3a342b)" : "var(--ochre, #c5491f)" }}>
            {isFree ? "Free" : item.admission}
          </span>
          {isCommunity && (
            <span style={{ background: "var(--cat-community-bg, #edf7ed)", padding: "2px 6px", borderRadius: 999, display: "inline-flex", alignItems: "center", height: 16 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--cat-community-fg, #2e7d32)", textTransform: "uppercase", lineHeight: 1 }}>
                🌱 Community
              </span>
            </span>
          )}
        </div>
        {Number(item.rsvpCount) > 0 && (
          <span style={{ fontSize: 11, color: "var(--mute, #7a6f5c)" }}>👥 {item.rsvpCount} going</span>
        )}
      </div>
    </div>
  );
}

export default function EventSpotlightCarousel({ events }: { events: FeedItem[] }) {
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);

  if (events.length < 2) return null;

  return (
    <div style={{ background: "var(--paper-warm, #f5f0e6)", padding: "16px 0", marginBottom: 24, borderTop: "1px solid rgba(200,191,176,0.4)", borderBottom: "1px solid rgba(200,191,176,0.4)" }}>
      <div style={{ padding: "0 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--ink, #14110d)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          📅 Upcoming Near You
        </h2>
        <Link href="/events" style={{ fontSize: 12, fontWeight: 700, color: "var(--ochre, #c5491f)", textDecoration: "none" }}>
          See all →
        </Link>
      </div>
      <div className="hide-scrollbar" style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 4px", scrollSnapType: "x mandatory" }}>
        {events.map(item => (
          <SpotlightCard key={item.id} item={item} onOpen={() => setActiveItem(item)} />
        ))}
      </div>

      {activeItem?.type === "happening" && (
        <HappeningDetailModal item={activeItem} onClose={() => setActiveItem(null)} />
      )}
      {activeItem?.type === "community" && (
        <CommunityDetailModal item={activeItem} onClose={() => setActiveItem(null)} />
      )}
    </div>
  );
}
