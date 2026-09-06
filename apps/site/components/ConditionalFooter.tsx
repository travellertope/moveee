"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

// The newsletter reader page ([slug]) renders its own fixed-height, self-scrolling
// reading pane (see IssueReaderClient.tsx's `.rd-layout`) with its own sidebar/footer
// nav — the sitewide Footer doesn't fit that layout and was removed from it on request.
// Every other /newsletter/* route (the archive hub, edition hubs, unsubscribe, and the
// two static list slugs) keeps the sitewide Footer as normal.
const STATIC_NEWSLETTER_SEGMENTS = new Set([
  "uk",
  "us",
  "africa",
  "unsubscribe",
  "getmelit",
  "culture-drop",
]);

function isNewsletterReaderPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  return (
    parts.length === 2 &&
    parts[0] === "newsletter" &&
    !STATIC_NEWSLETTER_SEGMENTS.has(parts[1])
  );
}

// The Moveee Literary renders its own dark footer (LiteraryFooter.tsx, via
// app/literary/layout.tsx) — the sitewide footer has no role on any page
// under /literary, same reasoning as the newsletter reader's own footer above.
function isLiteraryPath(pathname: string): boolean {
  return pathname === "/literary" || pathname.startsWith("/literary/");
}

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname && (isNewsletterReaderPath(pathname) || isLiteraryPath(pathname))) return null;
  return <Footer />;
}
