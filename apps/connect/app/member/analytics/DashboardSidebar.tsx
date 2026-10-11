"use client";

import Link from "next/link";
import { useState } from "react";

const EXPLORE_LINKS = [
  { href: "/newsletter", label: "Newsletters" },
  { href: "/events", label: "Upcoming Events" },
  { href: "https://themoveee.com", label: "Moveee Magazine" },
  { href: "/discover", label: "Discover Members" },
  { href: "/member/wallet", label: "My Wallet" },
  { href: "/member/perks", label: "Perks & Rewards" },
];

export default function DashboardSidebar({ profileUrl }: { profileUrl: string }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(profileUrl).then(
      () => { setCopied(true); setTimeout(() => setCopied(false), 2000); },
      () => { /* fallback: select a hidden input */ }
    );
  }

  return (
    <>
      {/* Stoop IRL */}
      <div className="pf-sidebar-section">
        <div className="pf-section-header">
          <div className="pf-section-title-row">
            <span className="pf-section-icon" aria-hidden="true">🏘️</span>
            <h3 className="pf-section-title">Stoop IRL</h3>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--mute)", marginBottom: "14px", lineHeight: 1.5 }}>
          Meet other members at a small weekly gathering near you.
        </p>
        <Link href="/connect/stoop" style={{
          display: "block", textAlign: "center",
          padding: "0.5rem 1rem",
          borderRadius: "var(--radius-full, 9999px)",
          background: "var(--ink, #14110d)", color: "var(--paper, #f3ece0)",
          fontSize: "0.75rem", fontWeight: 700, textDecoration: "none",
        }}>
          Find a Stoop →
        </Link>
      </div>

      {/* Invite a Friend */}
      <div className="pf-sidebar-section">
        <div className="pf-section-header">
          <div className="pf-section-title-row">
            <span className="pf-section-icon" aria-hidden="true">🤝</span>
            <h3 className="pf-section-title">Invite a Friend</h3>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--mute)", marginBottom: "10px", lineHeight: 1.5 }}>
          Share your profile link. Earn <strong style={{ color: "var(--ink)" }}>+25 points</strong> for every member who joins.
        </p>
        <div style={{
          display: "flex", gap: "6px", alignItems: "stretch",
          background: "var(--paper-deep, #f0ebe0)",
          borderRadius: "var(--radius-lg, 6px)",
          border: "1px solid var(--rule, #e8e2d8)",
          padding: "6px 8px",
          marginBottom: "8px",
        }}>
          <span style={{
            flex: 1, fontSize: "0.68rem", color: "var(--mute)", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: "1.8",
          }}>
            {profileUrl}
          </span>
          <button
            onClick={copyLink}
            style={{
              flexShrink: 0, padding: "2px 10px",
              background: copied ? "var(--ochre, #7a241c)" : "var(--ink, #14110d)",
              color: "#fff", border: "none", borderRadius: "var(--radius-md, 4px)",
              fontSize: "0.68rem", fontWeight: 700, cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Explore Moveee */}
      <div className="pf-sidebar-section">
        <div className="pf-section-header">
          <div className="pf-section-title-row">
            <h3 className="pf-section-title">Explore Moveee</h3>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {EXPLORE_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="pf-trending-card" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              fontSize: "0.8rem", fontWeight: 500, color: "var(--ink)", textDecoration: "none",
            }}>
              {label}
              <span style={{ fontSize: "0.6rem", color: "var(--mute)", marginLeft: "4px" }}>→</span>
            </Link>
          ))}
        </nav>
      </div>

      <p style={{ margin: "4px 0 0", fontSize: "0.67rem", color: "var(--mute)", lineHeight: 1.7 }}>
        © {new Date().getFullYear()} The Moveee. All Rights Reserved.
        <br />
        <Link href="/terms" style={{ color: "inherit" }}>Terms</Link>
        {" · "}
        <Link href="/privacy" style={{ color: "inherit" }}>Privacy</Link>
      </p>
    </>
  );
}
