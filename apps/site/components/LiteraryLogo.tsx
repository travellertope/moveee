import Link from "next/link";

// Text-based lockup per the brand guide's "Preferred visual masthead":
// bold "moveee" wordmark + oxblood dot, "L I T E R A R Y" tracked serif
// caps beneath. Deliberately not an image (unlike the site's own
// /logo-dark.png) — the exact letterforms/spacing are simple enough to
// render natively, and a text lockup stays crisp at any size without a
// second asset to generate/maintain.
export default function LiteraryLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/literary" className={`lit-logo${compact ? " lit-logo--compact" : ""}`} aria-label="The Moveee Literary">
      <span className="lit-logo-word">
        moveee<span className="lit-logo-dot" aria-hidden="true" />
      </span>
      <span className="lit-logo-sub">Literary</span>
    </Link>
  );
}
