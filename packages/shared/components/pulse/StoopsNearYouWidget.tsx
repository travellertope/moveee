"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StoredStoop {
  id: number;
  name: string;
  city: string;
  memberCount: number;
  isMember: boolean;
  coverGrad: string;
}

const COVER_GRADS = [
  "linear-gradient(135deg, #7a241c 0%, #1a0a08 100%)",
  "linear-gradient(135deg, #1a3a6a 0%, #0e1420 100%)",
  "linear-gradient(135deg, #6b4f12 0%, #1a1400 100%)",
  "linear-gradient(135deg, #1b4d2e 0%, #0a1a0a 100%)",
  "linear-gradient(135deg, #4a2068 0%, #140a1a 100%)",
  "linear-gradient(135deg, #2c3a4a 0%, #0e0e14 100%)",
];
function coverGrad(id: number): string {
  return COVER_GRADS[id % COVER_GRADS.length];
}

export default function StoopsNearYouWidget() {
  const [stoops, setStoops] = useState<StoredStoop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cluster/discover?per_page=4", { cache: "no-store" })
      .then(res => res.ok ? res.json() : { clusters: [] })
      .then(data => {
        const clusters: any[] = data.clusters ?? data ?? [];
        setStoops(
          clusters.slice(0, 4).map((c: any) => ({
            id: c.id,
            name: c.name,
            city: c.city ?? "",
            memberCount: c.memberCount ?? c.member_count ?? 0,
            isMember: Boolean(c.isMember ?? c.is_member),
            coverGrad: coverGrad(c.id),
          }))
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || stoops.length === 0) return null;

  return (
    <div className="pf-sidebar-section">
      <div className="pf-section-header">
        <div className="pf-section-title-row">
          <span className="pf-section-icon">🏘</span>
          <h3 className="pf-section-title">Stoops Near You</h3>
        </div>
        <Link href="/stoop" className="pf-section-see-all">See all</Link>
      </div>

      <div className="stoops-widget-list">
        {stoops.map(stoop => (
          <Link key={stoop.id} href={`/stoop/${stoop.id}`} className="stoops-widget-row">
            <span
              className="stoops-widget-cover"
              style={{ background: stoop.coverGrad }}
              aria-hidden="true"
            />
            <div className="stoops-widget-info">
              <p className="stoops-widget-name">{stoop.name}</p>
              {stoop.city && (
                <p className="stoops-widget-city">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: "middle" }}>
                    <path d="M12 22s8-7.58 8-13A8 8 0 1 0 4 9c0 5.42 8 13 8 13Z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                  {" "}{stoop.city}
                </p>
              )}
            </div>
            {stoop.isMember ? (
              <span className="stoops-widget-badge">Joined</span>
            ) : (
              <svg className="stoops-widget-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
