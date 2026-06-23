"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MyCluster {
  id: number;
  name: string;
  city?: string;
  meetingDay?: string;
  meetingTime?: string;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function HouseFellowshipReminderCard() {
  const [cluster, setCluster] = useState<MyCluster | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cluster/my-clusters")
      .then((res) => (res.ok ? res.json() : { clusters: [] }))
      .then((data) => {
        if (cancelled) return;
        const today = DAY_NAMES[new Date().getDay()];
        const match = (data.clusters ?? []).find(
          (c: MyCluster) => (c.meetingDay ?? "").toLowerCase() === today
        );
        if (match) setCluster(match);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!cluster) return null;

  return (
    <Link
      href={`/cluster/${cluster.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        background: "var(--paper-warm, #f3ece0)",
        borderRadius: 12,
        boxShadow: "0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)",
        borderLeft: "4px solid var(--ochre, #c5491f)",
        padding: "20px",
        textDecoration: "none",
        marginBottom: "1.25rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
        <span style={{
          flexShrink: 0,
          width: 48, height: 48,
          borderRadius: "50%",
          background: "#ffffff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.3rem",
        }}>
          🫂
        </span>
        <div>
          <p style={{
            margin: 0, fontFamily: "var(--font-serif, 'Fraunces', serif)",
            fontWeight: 700, fontSize: "0.95rem", color: "var(--ink, #14110d)",
          }}>
            {cluster.name} meets today{cluster.meetingTime ? ` at ${cluster.meetingTime}` : ""}
          </p>
          <p style={{
            margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--ink-soft, #3a342b)",
          }}>
            Check in when you arrive.
          </p>
        </div>
      </div>
      <span style={{
        flexShrink: 0, fontFamily: "var(--font-sans, 'DM Sans', sans-serif)",
        fontSize: "0.85rem", fontWeight: 700, color: "var(--ochre, #c5491f)",
        whiteSpace: "nowrap",
      }}>
        View →
      </span>
    </Link>
  );
}
