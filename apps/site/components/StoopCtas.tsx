"use client";

import { useSession } from "next-auth/react";

const CONNECT_URL = "https://web.themoveee.com";
const STOOP_URL = `${CONNECT_URL}/connect/stoop`;
const CREATE_URL = `${CONNECT_URL}/cluster/create`;
const REGISTER_HREF = `${CONNECT_URL}/register?callbackUrl=${encodeURIComponent(STOOP_URL)}`;
const SIGNIN_HREF = `${CONNECT_URL}/login?callbackUrl=${encodeURIComponent(STOOP_URL)}`;

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
export default function StoopCtas() {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && !!session?.user;

  if (signedIn) {
    return (
      <div className="stp-cta-row">
        <a className="stp-btn stp-btn--primary" href={STOOP_URL}>
          Find groups near you
        </a>
        <a className="stp-btn stp-btn--ghost" href={CREATE_URL}>
          Start a group
        </a>
      </div>
    );
  }

  return (
    <div className="stp-cta-row">
      <a className="stp-btn stp-btn--primary" href={REGISTER_HREF}>
        Get Started
      </a>
      <a className="stp-btn stp-btn--ghost" href={SIGNIN_HREF}>
        Sign in
      </a>
    </div>
  );
}
