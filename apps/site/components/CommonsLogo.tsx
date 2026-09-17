import Link from "next/link";

// No real lockup asset supplied yet — CSS-drawn text lockup, same "first
// pass before a real logo is supplied" precedent LiteraryLogo.tsx itself
// used before the real file existed (see that component's own history in
// CLAUDE.md). Swap for an <img> once a real asset is approved. Dark-footer
// coloring is handled entirely by the `.comm-page--inverted` ancestor class
// CommonsFooter.tsx wraps itself in — no prop needed here.
export default function CommonsLogo() {
  return (
    <Link href="/commons" aria-label="The Moveee Commons" className="comm-logo">
      <span className="comm-logo-the">The</span>
      <span className="comm-logo-mark">moveee.</span>
      <span className="comm-logo-sub">Commons</span>
    </Link>
  );
}
