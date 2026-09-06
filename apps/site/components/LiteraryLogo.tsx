import Link from "next/link";

// Real lockup asset (public/logo-literary.png) — the user's own approved
// file, not a CSS-drawn approximation. `inverted` renders it white for the
// dark footer (the source PNG is black-on-transparent, so `invert(1)` after
// `brightness(0)` forces every non-transparent pixel to pure white).
export default function LiteraryLogo({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  return (
    <Link href="/literary" aria-label="The Moveee Literary">
      <img
        src="/logo-literary.png"
        alt="The Moveee Literary"
        style={{
          height: compact ? 34 : 52,
          width: "auto",
          display: "block",
          filter: inverted ? "brightness(0) invert(1)" : undefined,
        }}
      />
    </Link>
  );
}
