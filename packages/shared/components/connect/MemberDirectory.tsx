"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProBadge from "@/components/ProBadge";
import { openSearchModal } from "@/lib/searchModalBus";
import { onPeopleFilters } from "@/lib/peopleFiltersBus";

interface Member {
  id: string;
  displayName: string;
  username: string;
  occupation: string;
  city: string;
  countryOfResidence: string;
  tier: "citizen" | "patron";
  bio?: string;
  disciplines?: string[];
  instagram?: string;
  linkedin?: string;
  website?: string;
  twitter?: string;
  registeredAt?: string;
}

// Mirrors PEOPLE_REGIONS in SearchModal.tsx — no shared source of truth,
// same caveat as the other facet-label maps in this codebase.
const REGION_LABELS: Record<string, string> = {
  nigeria: "Nigeria", ghana: "Ghana", uk: "UK", usa: "USA", "pan-african": "Pan-African",
};

// Mirrors PEOPLE_INDUSTRIES in SearchModal.tsx (colors for the active-filter
// chip's dot) — no shared source of truth, same caveat as above.
const INDUSTRY_COLORS: Record<string, string> = {
  Creative: "#7b1fa2", Entrepreneur: "#b38238", Artist: "#c2185b", Filmmaker: "#1976d2",
  Writer: "#78350f", Designer: "#00695c", Musician: "#6b48a8", Photographer: "#2e7d32",
  Tech: "#37474f", Legal: "#283593", Finance: "#8d6e63", Academic: "#5d4037",
};

// Purely decorative — no per-member color stored server-side, so a stable
// hash of the member id picks a consistent avatar color across renders.
const AVATAR_COLORS = [
  "#c5491f", "#1976d2", "#2e7d32", "#b38238", "#6b48a8", "#8d6e63",
  "#7b1fa2", "#c2185b", "#00695c", "#37474f", "#283593", "#5d4037",
];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// "New" badge threshold — matches the shop's existing "new" product badge
// convention (< 14 days old, see CLAUDE.md's Shop section).
function isNewMember(registeredAt?: string): boolean {
  if (!registeredAt) return false;
  const t = new Date(registeredAt.replace(" ", "T") + "Z").getTime();
  if (Number.isNaN(t)) return false;
  return (Date.now() - t) / 86400000 <= 14;
}

const PER_PAGE = 24;
const RAIL_PER_PAGE = 8;

interface Props {
  viewerCity?: string;
  viewerCountry?: string;
}

export default function MemberDirectory({ viewerCity = "", viewerCountry = "" }: Props) {
  // Industry/Location now live entirely inside SearchModal's People
  // context (see the People Near Me mockup) — this component only ever
  // reads them via peopleFiltersBus, never renders its own filter UI.
  const [industry, setIndustry] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);

  const [nearYou, setNearYou] = useState<Member[]>([]);
  const [nearYouLabel, setNearYouLabel] = useState("");
  const [newMembers, setNewMembers] = useState<Member[]>([]);
  const [entries, setEntries] = useState<Member[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => onPeopleFilters(({ industry: i, region: r }) => {
    setIndustry(i);
    setRegion(r);
  }), []);

  // Near You rail — only meaningful in the default "Near Me" state (region
  // === null); hidden once the viewer picks an explicit region or "All
  // Locations", since "near you" stops meaning anything at that point.
  useEffect(() => {
    if (region) { setNearYou([]); return; }
    const primary = viewerCity || viewerCountry;
    if (!primary) { setNearYou([]); return; }

    let cancelled = false;
    async function run() {
      const params = new URLSearchParams({ per_page: String(RAIL_PER_PAGE), location: primary });
      if (industry) params.set("discipline", industry);
      const res = await fetch(`/api/connect/members?${params}`);
      const data = res.ok ? await res.json() : { members: [] };
      let members: Member[] = data.members ?? [];
      let label = primary;

      // Fall back to country-wide if nobody in the exact city matches.
      if (members.length === 0 && viewerCity && viewerCountry && viewerCity !== viewerCountry) {
        const p2 = new URLSearchParams({ per_page: String(RAIL_PER_PAGE), location: viewerCountry });
        if (industry) p2.set("discipline", industry);
        const res2 = await fetch(`/api/connect/members?${p2}`);
        const data2 = res2.ok ? await res2.json() : { members: [] };
        members = data2.members ?? [];
        label = viewerCountry;
      }

      if (!cancelled) { setNearYou(members); setNearYouLabel(label); }
    }
    run().catch(() => { if (!cancelled) setNearYou([]); });
    return () => { cancelled = true; };
  }, [industry, region, viewerCity, viewerCountry]);

  // New to Moveee rail — site-wide (or region-scoped, if one's picked),
  // independent of the viewer's own location.
  useEffect(() => {
    const params = new URLSearchParams({ per_page: String(RAIL_PER_PAGE), sort: "recent" });
    if (industry) params.set("discipline", industry);
    if (region && region !== "all") params.set("region", region);
    fetch(`/api/connect/members?${params}`)
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d) => setNewMembers(d.members ?? []))
      .catch(() => setNewMembers([]));
  }, [industry, region]);

  const fetchPage = useCallback(async (off: number, replace: boolean) => {
    const params = new URLSearchParams({ per_page: String(PER_PAGE), offset: String(off) });
    if (industry) params.set("discipline", industry);
    if (region === "all") {
      // No location scoping at all.
    } else if (region) {
      params.set("region", region);
    } else {
      const primary = viewerCity || viewerCountry;
      if (primary) params.set("location", primary);
    }

    const res = await fetch(`/api/connect/members?${params}`);
    const data = res.ok ? await res.json() : { members: [] };
    let members: Member[] = data.members ?? [];

    // Same near-me city→country fallback the old component relied on,
    // only meaningful on the very first page of the default (unfiltered)
    // view.
    if (replace && members.length === 0 && !region && viewerCity && viewerCountry) {
      const p2 = new URLSearchParams({ per_page: String(PER_PAGE), offset: String(off), location: viewerCountry });
      if (industry) p2.set("discipline", industry);
      const res2 = await fetch(`/api/connect/members?${p2}`);
      const data2 = res2.ok ? await res2.json() : { members: [] };
      members = data2.members ?? [];
    }

    setEntries((prev) => (replace ? members : [...prev, ...members]));
    setHasMore(members.length >= PER_PAGE);
    setOffset(off + members.length);
  }, [industry, region, viewerCity, viewerCountry]);

  useEffect(() => {
    setLoading(true);
    fetchPage(0, true).finally(() => setLoading(false));
  }, [fetchPage]);

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(offset, false);
    setLoadingMore(false);
  }

  return (
    <div className="ppl-dir">
      <button type="button" className="ppl-search-btn" onClick={() => openSearchModal()}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        Search people by name, role, city…
      </button>

      {(industry || region) && (
        <div className="ppl-active-filters">
          {industry && (
            <span className="ppl-active-filter">
              <span className="ppl-active-filter-dot" style={{ background: INDUSTRY_COLORS[industry] ?? "#7a6f5c" }} />
              {industry}
              <button type="button" className="ppl-active-filter-clear" onClick={() => setIndustry(null)} aria-label="Clear industry filter">✕</button>
            </span>
          )}
          {region && (
            <span className="ppl-active-filter">
              📍 {region === "all" ? "All Locations" : REGION_LABELS[region] ?? region}
              <button type="button" className="ppl-active-filter-clear" onClick={() => setRegion(null)} aria-label="Clear location filter">✕</button>
            </span>
          )}
        </div>
      )}

      {nearYou.length > 0 && (
        <>
          <div className="ppl-rail-heading">Near You{nearYouLabel ? ` · ${nearYouLabel}` : ""}</div>
          <div className="ppl-rail">
            {nearYou.map((m) => <RailCard key={m.id} member={m} />)}
          </div>
        </>
      )}

      {newMembers.length > 0 && (
        <>
          <div className="ppl-rail-heading">New to Moveee</div>
          <div className="ppl-rail">
            {newMembers.map((m) => <RailCard key={m.id} member={m} showNew />)}
          </div>
        </>
      )}

      <div className="ppl-grid-heading">Explore More</div>

      {loading ? (
        <div className="ppl-grid" aria-busy="true" aria-label="Loading members">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ppl-card ppl-card--skeleton" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="ppl-empty">
          <span className="ppl-empty-icon" aria-hidden="true">👥</span>
          <p className="ppl-empty-title">No members found.</p>
          <p className="ppl-empty-body">
            Members who have opted into the directory will appear here. Try a different filter, or
            join Moveee and opt in from your profile settings to be listed.
          </p>
          <Link href="/register" className="ppl-empty-cta">Join &amp; get listed →</Link>
        </div>
      ) : (
        <>
          <div className="ppl-grid">
            {entries.map((m) => <MemberCard key={m.id} member={m} />)}
          </div>
          {hasMore ? (
            <button type="button" className="ppl-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          ) : (
            <div className="ppl-count">Showing {entries.length} member{entries.length !== 1 ? "s" : ""}</div>
          )}
        </>
      )}
    </div>
  );
}

function RailCard({ member, showNew }: { member: Member; showNew?: boolean }) {
  const location = [member.city, member.countryOfResidence].filter(Boolean).join(", ");
  return (
    <Link href={`/connect/${member.username}`} className="ppl-rail-card">
      {showNew && isNewMember(member.registeredAt) && <span className="ppl-new-badge">New</span>}
      <div className="ppl-rail-avatar" style={{ background: avatarColor(member.id) }} aria-hidden="true">
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <p className="ppl-rail-name">{member.displayName}</p>
      {member.occupation && <p className="ppl-rail-role">{member.occupation}</p>}
      {location && <p className="ppl-rail-loc">📍 {location}</p>}
    </Link>
  );
}

function MemberCard({ member }: { member: Member }) {
  const isPatron = member.tier === "patron";
  const location = [member.city, member.countryOfResidence].filter(Boolean).join(", ");
  const toUrl = (platform: "instagram" | "linkedin" | "website" | "twitter", value: string) => {
    if (/^https?:\/\//i.test(value)) return value;
    if (platform === "instagram") return `https://instagram.com/${value.replace(/^@/, "")}`;
    if (platform === "linkedin") return `https://linkedin.com/${value.replace(/^\//, "")}`;
    if (platform === "twitter") return `https://twitter.com/${value.replace(/^@/, "")}`;
    return `https://${value}`;
  };
  const links = [
    member.website   && { label: "Website",   glyph: "🌐", href: toUrl("website", member.website) },
    member.linkedin  && { label: "LinkedIn",   glyph: "in", href: toUrl("linkedin", member.linkedin) },
    member.instagram && { label: "Instagram",  glyph: "ig", href: toUrl("instagram", member.instagram) },
    member.twitter   && { label: "Twitter",    glyph: "𝕏",  href: toUrl("twitter", member.twitter) },
  ].filter(Boolean) as { label: string; glyph: string; href: string }[];

  return (
    <Link href={`/connect/${member.username}`} className={`ppl-card${isPatron ? " ppl-card--pro" : ""}`}>
      <div className="ppl-avatar" style={{ background: avatarColor(member.id) }} aria-hidden="true">
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="ppl-info">
        <p className="ppl-name">
          {member.displayName}
          {isPatron && <ProBadge size={14} />}
        </p>
        {member.occupation && <p className="ppl-role">{member.occupation}</p>}
        {location && <p className="ppl-loc">📍 {location}</p>}
        {member.disciplines && member.disciplines.length > 0 && (
          <div className="ppl-disciplines">
            {member.disciplines.slice(0, 3).map((d) => (
              <span key={d} className="ppl-discipline">{d}</span>
            ))}
          </div>
        )}
        {member.bio && <p className="ppl-bio">{member.bio}</p>}
        <div className="ppl-footer">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer noopener"
              className="ppl-link"
              aria-label={`${member.displayName} on ${l.label}`}
              onClick={(e) => e.stopPropagation()}
            >
              {l.glyph}
            </a>
          ))}
          <span className="ppl-view">View Profile →</span>
        </div>
      </div>
    </Link>
  );
}
