"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface StoopData {
  id: number;
  name: string;
  city: string;
  meetingDay: string;
  meetingTime: string;
  memberCount: number;
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
function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

interface Props {
  clusterId: number;
}

export default function StoopEmbedCard({ clusterId }: Props) {
  const [stoop, setStoop] = useState<StoopData | null>(null);

  useEffect(() => {
    fetch(`/api/cluster/${clusterId}`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) return;
        setStoop({
          id: data.id,
          name: data.name,
          city: data.city ?? "",
          meetingDay: data.meetingDay ?? "",
          meetingTime: data.meetingTime ?? "",
          memberCount: data.memberCount ?? 0,
          coverGrad: coverGrad(data.id),
        });
      })
      .catch(() => {});
  }, [clusterId]);

  if (!stoop) return null;

  const scheduleLabel = stoop.meetingDay
    ? `Every ${capitalize(stoop.meetingDay)}${stoop.meetingTime ? ` · ${stoop.meetingTime}` : ""}`
    : null;

  return (
    <Link href={`/stoop/${clusterId}`} className="stoop-embed-card" onClick={e => e.stopPropagation()}>
      <span
        className="stoop-embed-cover"
        style={{ background: stoop.coverGrad }}
        aria-hidden="true"
      />
      <div className="stoop-embed-info">
        <span className="stoop-embed-label">Stoop Spotlight</span>
        <p className="stoop-embed-name">{stoop.name}</p>
        {(scheduleLabel || stoop.city) && (
          <p className="stoop-embed-meta">
            {[scheduleLabel, stoop.city].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <span className="stoop-embed-btn">Open Stoop →</span>
    </Link>
  );
}
