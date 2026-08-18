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

export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname && isNewsletterReaderPath(pathname)) return null;
  return <Footer />;
}
