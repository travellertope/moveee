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
        background: "#14110d",
        color: "#f3ece0",
        borderRadius: 12,
        padding: "1rem 1.25rem",
        textDecoration: "none",
        marginBottom: "1.25rem",
      }}
    >
      <div>
        <span style={{
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#b38238",
        }}>
          House Fellowship · Today
        </span>
        <p style={{ margin: "0.35rem 0 0", fontSize: "0.95rem", fontWeight: 600 }}>
          {cluster.name} meets today{cluster.meetingTime ? ` at ${cluster.meetingTime}` : ""} — check in when you arrive.
        </p>
      </div>
      <span style={{
        flexShrink: 0, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "#14110d", background: "#b38238",
        padding: "0.5rem 0.9rem", borderRadius: 6, whiteSpace: "nowrap",
      }}>
        Check in →
      </span>
    </Link>
  );
}
