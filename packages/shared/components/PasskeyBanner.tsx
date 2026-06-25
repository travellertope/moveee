"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  creditsEscrowed?: number;
}

export default function PasskeyBanner({ creditsEscrowed = 0 }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="mem-passkey-banner">
      <div className="mem-passkey-banner-inner">
        <span className="mem-passkey-banner-icon">🔑</span>
        <div className="mem-passkey-banner-copy">
          <span className="mem-passkey-banner-title">
            {creditsEscrowed > 0
              ? `You have ${creditsEscrowed} credits waiting — they'll be released once you add a passkey.`
              : "Set up a Passkey to unlock Credits"}
          </span>
          <span className="mem-passkey-banner-desc">
            Passkeys are required to spend credits and redeem partner perks. Takes 30 seconds.
          </span>
        </div>
      </div>
      <div className="mem-passkey-banner-actions">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mem-passkey-banner-dismiss"
        >
          Dismiss
        </button>
        <Link href="/member/settings/security" className="mem-passkey-banner-cta">
          Set up Passkey →
        </Link>
      </div>
    </div>
  );
}
