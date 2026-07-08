"use client";

import { useSession } from "next-auth/react";

/**
 * Wraps a newsletter subscribe box/section. Logged-in members are treated as
 * already subscribed (GmlCTAForm / NewsletterSubscribeWidget auto-subscribe
 * authenticated users on mount) — so instead of swapping the form for a
 * "Subscribed as a member / Manage Preferences" block, the whole box is
 * hidden. Preference management already has a real home at
 * /member/settings/newsletters.
 */
export default function HideIfSubscribed({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  if (status === "authenticated") return null;
  return <>{children}</>;
}
