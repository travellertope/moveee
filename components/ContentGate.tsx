import Link from "next/link";
import type { AccessLevel } from "@/lib/access";

interface ContentGateProps {
  /** The access level required — never "public" (those don't need a gate). */
  accessLevel: Exclude<AccessLevel, "public">;
  /** Whether the current visitor is authenticated (any tier). */
  isLoggedIn: boolean;
}

/**
 * ContentGate
 *
 * Renders an editorial-style paywall / login prompt when a visitor lacks the
 * tier required to read a piece of content. Matches the site's dark ink on
 * parchment aesthetic.
 *
 * Gate states:
 *   member-only  + visitor  → prompt to create a free account or sign in
 *   patron-only  + visitor  → prompt to become a Patron or sign in
 *   patron-only  + citizen  → prompt to upgrade to Patron
 *
 * (member-only + logged-in user is handled by canViewContent and never shown.)
 */
export default function ContentGate({ accessLevel, isLoggedIn }: ContentGateProps) {
  const isPatronGate = accessLevel === "patron-only";

  /* ── Copy ─────────────────────────────────────────────────────────────── */
  let tierLabel: string;
  let heading: string;
  let body: string;
  let primaryBtn: { label: string; href: string };
  let secondaryBtn: { label: string; href: string } | null;
  let footnote: string;

  if (isPatronGate && !isLoggedIn) {
    tierLabel = "Patron Members";
    heading = "This piece is for Patron members.";
    body =
      "Become a Patron to read this and all exclusive long-form content — plus in-person events, dual chapter membership, priority RSVPs, and more.";
    primaryBtn = { label: "Become a Patron →", href: "/register?tier=patron" };
    secondaryBtn = { label: "Sign in", href: "/login" };
    footnote = "Patron · $80 / year · Cancel anytime";
  } else if (isPatronGate && isLoggedIn) {
    // Logged in as Citizen (if they were Patron, canViewContent would be true)
    tierLabel = "Patron Members";
    heading = "Patron membership required.";
    body =
      "Upgrade your membership to unlock this piece and all exclusive Patron content — plus in-person events and dual chapter access.";
    primaryBtn = { label: "Upgrade to Patron →", href: "/connect" };
    secondaryBtn = null;
    footnote = "$80 / year · Cancel anytime";
  } else {
    // member-only + visitor (logged-in members never see this state)
    tierLabel = "Members";
    heading = "This piece is for members.";
    body =
      "Join The Moveee to read this and all member content. Citizen membership is free, forever.";
    primaryBtn = { label: "Create Free Account →", href: "/register" };
    secondaryBtn = { label: "Sign in", href: "/login" };
    footnote = "Citizen membership · Free forever";
  }

  /* ── Styles ────────────────────────────────────────────────────────────── */
  const wrap: React.CSSProperties = {
    borderTop: "1px solid rgba(20,17,13,.12)",
    padding: "40px 0 48px",
  };

  const lockIconStyle: React.CSSProperties = {
    display: "block",
    width: 28,
    height: 28,
    color: "#b38238",
    marginBottom: 20,
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 9,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "#b38238",
    marginBottom: 16,
  };

  const headingStyle: React.CSSProperties = {
    fontFamily: "'Fraunces', serif",
    fontSize: "clamp(20px, 3vw, 27px)",
    fontWeight: 300,
    color: "#14110d",
    margin: "0 0 14px",
    lineHeight: 1.25,
  };

  const bodyStyle: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.65,
    color: "rgba(20,17,13,.6)",
    margin: "0 0 28px",
    maxWidth: 480,
  };

  const btnRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 18,
  };

  const primaryBtnStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "11px 22px",
    background: "#14110d",
    color: "#f5f0e8",
    textDecoration: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    borderRadius: 2,
  };

  const secondaryBtnStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "11px 18px",
    border: "1px solid rgba(20,17,13,.2)",
    color: "#14110d",
    textDecoration: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    letterSpacing: ".1em",
    textTransform: "uppercase",
    borderRadius: 2,
  };

  const footnoteStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: ".1em",
    color: "rgba(20,17,13,.35)",
    margin: 0,
  };

  return (
    <div style={wrap}>
      {/* Lock icon */}
      <svg
        style={lockIconStyle}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>

      {/* Tier label */}
      <div style={labelStyle}>★ {tierLabel}</div>

      {/* Heading */}
      <h3 style={headingStyle}>{heading}</h3>

      {/* Body copy */}
      <p style={bodyStyle}>{body}</p>

      {/* CTA buttons */}
      <div style={btnRowStyle}>
        <Link href={primaryBtn.href} style={primaryBtnStyle}>
          {primaryBtn.label}
        </Link>
        {secondaryBtn && (
          <Link href={secondaryBtn.href} style={secondaryBtnStyle}>
            {secondaryBtn.label}
          </Link>
        )}
      </div>

      {/* Fine print */}
      <p style={footnoteStyle}>{footnote}</p>
    </div>
  );
}
