"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Member {
  id: string;
  displayName: string;
  occupation: string;
  city: string;
  countryOfResidence: string;
  tier: "citizen" | "patron";
  chapter?: string;
  bio?: string;
  disciplines?: string[];
  instagram?: string;
  linkedin?: string;
  website?: string;
}

const DISCIPLINES = [
  "All", "Creative", "Entrepreneur", "Artist", "Filmmaker", "Writer",
  "Designer", "Musician", "Photographer", "Tech", "Legal", "Finance", "Academic",
];

const LOCATIONS = [
  "All", "Nigeria", "United Kingdom", "United States", "Ghana",
  "South Africa", "Kenya", "France", "Canada", "Other",
];

export default function MemberDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [location, setLocation] = useState("All");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (discipline !== "All") params.set("discipline", discipline);
      if (location !== "All") params.set("location", location);
      const res = await fetch(`/api/connect/members?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members ?? []);
      }
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [search, discipline, location]);

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
            placeholder="Search by name, role, or location…"
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
            aria-label="Filter by discipline"
          >
            {DISCIPLINES.map(d => (
              <option key={d} value={d}>{d === "All" ? "All disciplines" : d}</option>
            ))}
          </select>
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="mco-dir-select"
            aria-label="Filter by location"
          >
            {LOCATIONS.map(l => (
              <option key={l} value={l}>{l === "All" ? "All locations" : l}</option>
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
          <p className="mco-dir-empty-title">The directory is growing.</p>
          <p className="mco-dir-empty-body">
            Members who have opted into the directory will appear here — the Lagos photographer,
            the UK art director, the Nigerian lawyer in New York. Join Moveee Connect and opt in
            from your profile settings to be listed.
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
  const links = [
    member.instagram && { label: "Instagram", href: `https://instagram.com/${member.instagram.replace(/^@/, "")}` },
    member.linkedin  && { label: "LinkedIn",  href: member.linkedin.startsWith("http") ? member.linkedin : `https://${member.linkedin}` },
    member.website   && { label: "Website",   href: member.website.startsWith("http")  ? member.website  : `https://${member.website}` },
  ].filter(Boolean) as { label: string; href: string }[];

  return (
    <div className={`mco-member-card${isPatron ? " mco-member-card--patron" : ""}`}>
      <div className="mco-member-avatar" aria-hidden="true">
        {member.displayName.charAt(0).toUpperCase()}
      </div>
      <div className="mco-member-info">
        <h3 className="mco-member-name">{member.displayName}</h3>
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
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
        {member.chapter && (
          <p className="mco-member-chapter">{member.chapter}</p>
        )}
      </div>
      {isPatron && (
        <span className="mco-member-tier" aria-label="Patron member">Patron</span>
      )}
    </div>
  );
}
