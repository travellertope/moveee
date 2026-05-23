import Link from "next/link";
import type { AccessLevel } from "@/lib/access";
import PatronPrice from "./PatronPrice";

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
  let footnote: React.ReactNode;

  if (isPatronGate && !isLoggedIn) {
    tierLabel = "Connect Pro";
    heading = "There's more on the other side.";
    body =
      "This piece goes deeper — reserved for Connect Pro members. Join a community of culture-forward people across Africa and the diaspora. Events, dual chapter access, priority RSVPs, and long-form content worth your time.";
    primaryBtn = { label: "Explore Connect Pro →", href: "/register?tier=patron" };
    secondaryBtn = { label: "Already a member? Sign in", href: "/login" };
    footnote = (
      <span>
        Connect Pro · <PatronPrice variant="yearly" /> · Cancel anytime · Free account always available
      </span>
    );
  } else if (isPatronGate && isLoggedIn) {
    tierLabel = "Connect Pro";
    heading = "You're one step away.";
    body =
      "This piece is part of our Connect Pro archive — extended reads, member events, and dual chapter access for people who want to go further with The Moveee community.";
    primaryBtn = { label: "Upgrade to Connect Pro →", href: "/connect" };
    secondaryBtn = null;
    footnote = (
      <span>
        <PatronPrice variant="yearly" /> · Cancel anytime
      </span>
    );
  } else {
    // member-only + visitor
    tierLabel = "Moveee Community";
    heading = "This one's for the community.";
    body =
      "Create a free Moveee account to read this and everything else in the member archive. Takes 30 seconds — no card needed, free forever.";
    primaryBtn = { label: "Join free — it takes 30 seconds →", href: "/register" };
    secondaryBtn = { label: "Already have an account? Sign in", href: "/login" };
    footnote = "Free membership · No credit card · Cancel anytime";
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
    color: "#ffffff",
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
      {/* Key icon */}
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
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="M21 2L13 10" />
        <path d="M18 5l3 3" />
        <path d="M15 8l1.5 1.5" />
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
