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
}

const DISCIPLINES = [
  "All", "Creative", "Entrepreneur", "Professional", "Artist",
  "Filmmaker", "Writer", "Designer", "Musician", "Tech", "Legal", "Finance",
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
      {/* Search + filter bar */}
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
            the UK art director, the Nigerian lawyer in New York. Join Moveee Connect and complete
            your profile to be listed.
          </p>
          <Link href="/register" className="mco-dir-empty-cta">Join &amp; get listed →</Link>
        </div>
      ) : (
        <div className="mco-dir-grid">
          {members.map(member => (
            <div
              key={member.id}
              className={`mco-member-card${member.tier === "patron" ? " mco-member-card--patron" : ""}`}
            >
              <div className="mco-member-avatar" aria-hidden="true">
                {member.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="mco-member-info">
                <h3 className="mco-member-name">{member.displayName}</h3>
                {member.occupation && (
                  <p className="mco-member-role">{member.occupation}</p>
                )}
                <p className="mco-member-location">
                  {[member.city, member.countryOfResidence].filter(Boolean).join(", ")}
                </p>
                {member.chapter && (
                  <p className="mco-member-chapter">{member.chapter}</p>
                )}
              </div>
              {member.tier === "patron" && (
                <span className="mco-member-tier" aria-label="Patron member">Patron</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
