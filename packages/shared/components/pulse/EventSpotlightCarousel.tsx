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
  if (!category) return "#7A6F5C";
  const lower = category.toLowerCase();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (lower.includes(key)) return CATEGORY_COLORS[key];
  }
  return "#7A6F5C";
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
        background: "#fff",
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
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 2, background: "#B38238", zIndex: 1 }} />
      )}
      <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: categoryColor(item.eventCategory) }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#7A6F5C", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {item.eventCategory || "Event"}
          </span>
        </div>
        {item.isFeatured && <span style={{ color: "#B38238", fontSize: 12 }}>★</span>}
      </div>
      <div style={{ padding: "0 12px", display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 700, color: "#C5491F", textTransform: "uppercase" }}>
          {date}
        </span>
        {time && <span style={{ fontSize: 11, color: "#7A6F5C" }}>{time}</span>}
      </div>
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", flex: 1, marginTop: 6 }}>
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#14110D",
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
          <span style={{ fontSize: 12, color: "#7A6F5C", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            📍 {venue}
          </span>
        )}
      </div>
      <div style={{ margin: "10px 12px 12px", paddingTop: 8, borderTop: "1px solid #EEE8DF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: isFree ? 400 : 700, color: isFree ? "#3A342B" : "#C5491F" }}>
            {isFree ? "Free" : item.admission}
          </span>
          {isCommunity && (
            <span style={{ background: "#E6F4EA", padding: "2px 6px", borderRadius: 999, display: "inline-flex", alignItems: "center", height: 16 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#2D6A4F", textTransform: "uppercase", lineHeight: 1 }}>
                🌱 Community
              </span>
            </span>
          )}
        </div>
        {Number(item.rsvpCount) > 0 && (
          <span style={{ fontSize: 11, color: "#7A6F5C" }}>👥 {item.rsvpCount} going</span>
        )}
      </div>
    </div>
  );
}

export default function EventSpotlightCarousel({ events }: { events: FeedItem[] }) {
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);

  if (events.length < 2) return null;

  return (
    <div style={{ background: "#F5F0E6", padding: "16px 0", marginBottom: 24, borderTop: "1px solid rgba(200,191,176,0.4)", borderBottom: "1px solid rgba(200,191,176,0.4)" }}>
      <div style={{ padding: "0 16px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: "#14110D", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
          📅 Upcoming Near You
        </h2>
        <Link href="/events" style={{ fontSize: 12, fontWeight: 700, color: "#C5491F", textDecoration: "none" }}>
          See all →
        </Link>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 4px", scrollSnapType: "x mandatory" }}>
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
