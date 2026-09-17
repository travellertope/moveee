import Link from "next/link";

// Real lockup assets (public/commons-logo-black.png + -white.png — the
// user's own approved files, cropped tight to their alpha bounding box,
// same convention as logo-literary.png/logo-black.png elsewhere in this
// app) — replaces the earlier CSS-drawn placeholder text lockup. Two real
// files rather than one file + a CSS invert filter, since the accent dot is
// oxblood in both versions, not just inverted-to-white like the wordmark —
// a `filter: invert()` on the black file would have turned that dot cyan.
// Dark-footer coloring is still handled purely by the `.comm-page--inverted`
// ancestor class CommonsFooter.tsx wraps itself in (both <img>s render;
// commons.css toggles which one is visible) — no prop needed here, same as
// before.
export default function CommonsLogo() {
  return (
    <Link href="/commons" aria-label="The Moveee Commons" className="comm-logo">
      <img src="/commons-logo-black.png" alt="The Moveee Commons" className="comm-logo-img comm-logo-img--black" />
      <img src="/commons-logo-white.png" alt="The Moveee Commons" className="comm-logo-img comm-logo-img--white" />
    </Link>
  );
}
