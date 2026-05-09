"use client";

import { useState, useMemo } from "react";
import DiscoveredEventRow from "./DiscoveredEventRow";

interface SeededEvent {
  id: string | number;
  slug: string;
  title: string;
  eventDate?: string;
  date?: string;
  location?: string;
  ticketingUrl?: string | null;
  cultureInterests?: { nodes: Array<{ name: string }> };
}

interface CommunityRadarSectionProps {
  events: SeededEvent[];
}

function getCategory(event: SeededEvent): string {
  return Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
    ? event.cultureInterests.nodes[0].name
    : "";
}

function getDateStr(event: SeededEvent): string {
  const d = new Date(event.eventDate || event.date || Date.now());
  return isNaN(d.getTime())
    ? "TBA"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function CommunityRadarSection({ events }: CommunityRadarSectionProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = useMemo(() => {
    const cats = new Set<string>();
    events.forEach((e) => {
      const cat = getCategory(e);
      if (cat) cats.add(cat);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [events]);

  const sorted = useMemo(
    () =>
      [...events].sort((a, b) => {
        const da = new Date(a.eventDate || a.date || 0).getTime();
        const db = new Date(b.eventDate || b.date || 0).getTime();
        return da - db;
      }),
    [events]
  );

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? sorted
        : sorted.filter((e) => getCategory(e) === activeCategory),
    [sorted, activeCategory]
  );

  if (events.length === 0) return null;

  return (
    <section className="disc-section">
      <div className="disc-section-inner">
        <div className="disc-header">
          <div>
            <span className="disc-eyebrow">Community Radar</span>
            <h2 className="disc-heading">More <em>Happenings</em></h2>
            <p className="disc-subhead">
              AI-discovered events across the diaspora — sourced from the web and curated for our community.
            </p>
          </div>
          <span className="disc-total">
            {filtered.length} {activeCategory !== "All" ? `in ${activeCategory}` : "discovered"}
          </span>
        </div>

        {/* Category filter pills */}
        {categories.length > 2 && (
          <div className="disc-filter-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`disc-filter-pill${activeCategory === cat ? " disc-filter-pill--active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="disc-list">
          {filtered.map((event) => (
            <DiscoveredEventRow
              key={event.id}
              slug={event.slug}
              title={event.title}
              date={getDateStr(event)}
              city={event.location || ""}
              category={getCategory(event)}
              ticketingUrl={event.ticketingUrl}
            />
          ))}
          {filtered.length === 0 && (
            <p style={{ color: "rgba(20,17,13,0.45)", fontSize: "0.85rem", padding: "2rem 0" }}>
              No events in this category yet. Check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
