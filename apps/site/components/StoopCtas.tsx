"use client";

import { useSession } from "next-auth/react";

const CONNECT_URL = "https://web.themoveee.com";
const STOOP_URL = `${CONNECT_URL}/connect/stoop`;
const CREATE_URL = `${CONNECT_URL}/cluster/create`;
const REGISTER_HREF = `${CONNECT_URL}/register?callbackUrl=${encodeURIComponent(STOOP_URL)}`;
const SIGNIN_HREF = `${CONNECT_URL}/login?callbackUrl=${encodeURIComponent(STOOP_URL)}`;

interface StoopCtasProps {
  /**
   * "hero" sits on the light hero section (red primary / dark outline,
   * .stp-hero-actions wrapper); "cta" sits on the dark closing band (cream
   * primary / cream outline, .stp-cta-btns wrapper, centered).
   */
  variant: "hero" | "cta";
}

/**
 * The Stoop landing page's CTA pair, as a client island.
 *
 * "Get Started" / "Sign in" is nonsense to a member who is already signed in
 * — they should be sent to the Stoops themselves, not asked to make an
 * account they have. Session state lives on a shared .themoveee.com cookie,
 * so Site A can read it; LiteraryMasthead.tsx is the same pattern.
 *
 * Deliberately an island rather than making the page itself dynamic: only
 * these two buttons need the session, so the rest of the page stays static
 * and cacheable. While the session resolves we render the signed-out pair —
 * it's the common case on a marketing page, so it's the right thing to show
 * during that flicker rather than an empty gap that shifts the layout.
 */
export default function StoopCtas({ variant }: StoopCtasProps) {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;

  const wrapperClass = variant === "hero" ? "stp-hero-actions" : "stp-cta-btns";
  const primaryClass = variant === "hero" ? "stp-btn stp-btn-red" : "stp-btn stp-btn-cream";
  const secondaryClass = variant === "hero" ? "stp-btn stp-btn-outline" : "stp-btn stp-btn-outline-cream";

  const primaryLabel = signedIn ? "Find groups near you" : "Get Started";
  const primaryHref = signedIn ? STOOP_URL : REGISTER_HREF;
  const secondaryLabel = signedIn ? "Start a group" : "Sign in";
  const secondaryHref = signedIn ? CREATE_URL : SIGNIN_HREF;

  return (
    <div className={wrapperClass}>
      <a className={primaryClass} href={primaryHref}>
        {primaryLabel}
      </a>
      <a className={secondaryClass} href={secondaryHref}>
        {secondaryLabel}
      </a>
    </div>
  );
}
