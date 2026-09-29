import Link from "next/link";

const CONNECT_URL = "https://web.themoveee.com";

// Fixed nav bar for the /stoop marketing page — brand + in-page anchor
// links (About/How it works/Hosting/FAQ, matching the section ids in
// page.tsx) + a real CTA straight to the live browse-groups page on Site B,
// rather than the mockup's own #join anchor (the CTA section below already
// repeats this exact button, so the nav one goes straight to the real
// destination instead of just scrolling to a duplicate).
export default function StoopMasthead() {
  return (
    <header className="stp-header">
      <nav className="stp-nav">
        <Link href="/stoop" className="stp-nav-brand">
          The Moveee <span className="stp-sep">/</span> Stoop
        </Link>
        <ul className="stp-nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#hosting">Hosting</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <a href={`${CONNECT_URL}/connect/stoop`} className="stp-btn stp-btn-dark stp-btn-nav">
          Find a group
        </a>
      </nav>
    </header>
  );
}
