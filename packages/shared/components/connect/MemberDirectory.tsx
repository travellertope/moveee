"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ProBadge from "@/components/ProBadge";

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
}

const DISCIPLINES = [
  "All", "Creative", "Entrepreneur", "Artist", "Filmmaker", "Writer",
  "Designer", "Musician", "Photographer", "Tech", "Legal", "Finance", "Academic",
];

interface Props {
  viewerCity?: string;
  viewerCountry?: string;
}

export default function MemberDirectory({ viewerCity = "", viewerCountry = "" }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("All");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (discipline !== "All") params.set("discipline", discipline);
      // People Near Me: scope to the viewer's own city first, falling back to
      // their country if nobody in their exact city matches.
      if (viewerCity) params.set("location", viewerCity);
      else if (viewerCountry) params.set("location", viewerCountry);

      let res = await fetch(`/api/connect/members?${params}`);
      let data = res.ok ? await res.json() : { members: [] };

      if (viewerCity && viewerCountry && (data.members ?? []).length === 0) {
        params.set("location", viewerCountry);
        res = await fetch(`/api/connect/members?${params}`);
        data = res.ok ? await res.json() : { members: [] };
      }

      setMembers(data.members ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [search, discipline, viewerCity, viewerCountry]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchMembers, search]);

  return (
    <div className="mco-dir">
      <div className="mco-dir-controls">
        <div className="mco-dir-search-wrap">
          <input
            type="search"
            placeholder="Search by name or role…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mco-dir-search"
            aria-label="Search members"
          />
        </div>
        <div className="mco-dir-filters">
          <select
            value={discipline}
            onChange={e => setDiscipline(e.target.value)}
            className="mco-dir-select"
            aria-label="Filter by industry"
          >
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{d === "All" ? "All industries" : d}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mco-dir-loading" aria-busy="true" aria-label="Loading members">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mco-member-card mco-member-card--skeleton" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="mco-dir-empty">
          <p className="mco-dir-empty-title">No one near you yet.</p>
          <p className="mco-dir-empty-body">
            Members who have opted into the directory will appear here once someone near you
            joins. Join Moveee and opt in from your profile settings to be listed.
          </p>
          <Link href="/register" className="mco-dir-empty-cta">Join &amp; get listed →</Link>
        </div>
      ) : (
        <div className="mco-dir-grid">
          {members.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
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
    member.instagram && { label: "Instagram", href: toUrl("instagram", member.instagram) },
    member.linkedin  && { label: "LinkedIn",  href: toUrl("linkedin", member.linkedin) },
    member.website   && { label: "Website",   href: toUrl("website", member.website) },
    member.twitter   && { label: "Twitter",   href: toUrl("twitter", member.twitter) },
  ].filter(Boolean) as { label: string; href: string }[];

  const inner = (
    <div className={`mco-member-card${isPatron ? " mco-member-card--patron" : ""}`}>
      <div className="mco-member-avatar" aria-hidden="true">
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="mco-member-info">
        <h3 className="mco-member-name">
          <span className="mco-member-name-text">{member.displayName}</span>
          {isPatron && <ProBadge size={14} />}
        </h3>
        {member.occupation && (
          <p className="mco-member-role">{member.occupation}</p>
        )}
        {location && (
          <p className="mco-member-location">{location}</p>
        )}
        {member.disciplines && member.disciplines.length > 0 && (
          <div className="mco-member-disciplines">
            {member.disciplines.slice(0, 3).map(d => (
              <span key={d} className="mco-member-discipline">{d}</span>
            ))}
          </div>
        )}
        {member.bio && (
          <p className="mco-member-bio">{member.bio}</p>
        )}
        {links.length > 0 && (
          <div className="mco-member-links">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="mco-member-link"
                aria-label={`${member.displayName} on ${l.label}`}
                onClick={e => e.stopPropagation()}
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (member.username) {
    return (
      <Link href={`/connect/${member.username}`} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}
