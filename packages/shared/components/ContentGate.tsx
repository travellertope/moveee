import Link from "next/link";
import type { AccessLevel } from "@/lib/access";
import PatronPrice from "./PatronPrice";

interface ContentGateProps {
  accessLevel: Exclude<AccessLevel, "public">;
  isLoggedIn: boolean;
  callbackUrl?: string;
}

export default function ContentGate({ accessLevel, isLoggedIn, callbackUrl = "/member" }: ContentGateProps) {
  const isPatronGate = accessLevel === "patron-only";

  let tierLabel: string;
  let heading: string;
  let body: string;
  let primaryBtn: { label: string; href: string };
  let secondaryBtn: { label: string; href: string } | null;
  let footnote: React.ReactNode;

  if (isPatronGate && !isLoggedIn) {
    tierLabel = "Moveee Pro";
    heading = "There's more on the other side.";
    body =
      "This piece goes deeper — reserved for Moveee Pro members. Join a global community of culture-forward people, with exclusive editorials, a Pro badge, and long-form content worth your time.";
    primaryBtn = { label: "Explore Moveee Pro →", href: "/register?tier=patron" };
    secondaryBtn = { label: "Already a member? Sign in", href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` };
    footnote = (
      <span>
        Moveee Pro · <PatronPrice variant="yearly" /> · Cancel anytime · Free account always available
      </span>
    );
  } else if (isPatronGate && isLoggedIn) {
    tierLabel = "Moveee Pro";
    heading = "You're one step away.";
    body =
      "This piece is part of our Moveee Pro archive — extended reads, exclusive member events, and long-form content for people who want to go further with The Moveee community.";
    primaryBtn = { label: "Upgrade to Moveee Pro →", href: "/feed" };
    secondaryBtn = null;
    footnote = (
      <span>
        <PatronPrice variant="yearly" /> · Cancel anytime
      </span>
    );
  } else {
    tierLabel = "Moveee Community";
    heading = "This one's for the community.";
    body =
      "Create a free Moveee account to read this and everything else in the member archive. Takes 30 seconds — no card needed, free forever.";
    primaryBtn = { label: "Join free — it takes 30 seconds →", href: "/register" };
    secondaryBtn = { label: "Already have an account? Sign in", href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` };
    footnote = "Free membership · No credit card · Cancel anytime";
  }

  return (
    <div className={`ar-gate${isPatronGate ? ' ar-gate--patron' : ''}`}>
      <div className="ar-gate-header">
        <div className="ar-gate-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: isPatronGate ? 'var(--ar-gold)' : 'var(--ar-ochre)' }}
          >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="M21 2L13 10" />
            <path d="M18 5l3 3" />
            <path d="M15 8l1.5 1.5" />
          </svg>
        </div>
        <div className="ar-gate-tier">★ {tierLabel}</div>
      </div>

      <h3>{heading}</h3>
      <p>{body}</p>

      <div className="ar-gate-btns">
        <Link href={primaryBtn.href} className="ar-gate-btn-primary">
          {primaryBtn.label}
        </Link>
        {secondaryBtn && (
          <Link href={secondaryBtn.href} className="ar-gate-btn-secondary">
            {secondaryBtn.label}
          </Link>
        )}
      </div>

      <p className="ar-gate-footnote">{footnote}</p>
    </div>
  );
}
