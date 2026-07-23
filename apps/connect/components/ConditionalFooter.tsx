"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

// /feed is infinite-scroll — the full footer (link columns, newsletter
// signup, social icons, legal links) is effectively unreachable there, so
// it's skipped in favor of a minimal copyright line in the feed's own
// right rail (see PulseFeed.tsx). Every other apps/connect page keeps the
// full footer as normal.
export default function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/feed") return null;
  return <Footer />;
}
