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
    <div style={{
      background: "rgba(179,130,56,.08)",
      border: "1px solid rgba(179,130,56,.25)",
      borderRadius: 6,
      padding: "14px 18px",
      marginBottom: 20,
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
    }}>
      <span style={{ fontSize: "1.3rem", flexShrink: 0, lineHeight: 1 }}>🔑</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
          Set up a Passkey to unlock Credits
        </div>
        <div style={{ fontSize: "0.78rem", color: "var(--mute)", lineHeight: 1.5 }}>
          {creditsEscrowed > 0
            ? `You have ${creditsEscrowed} credits waiting — they'll be released once you add a passkey.`
            : "Passkeys are required to spend credits and redeem partner perks. Takes 30 seconds."}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Link href="/member/settings#passkeys" style={{
            display: "inline-block",
            padding: "6px 14px",
            background: "var(--ochre)",
            color: "#fff",
            borderRadius: 3,
            fontSize: "0.75rem",
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: ".06em",
          }}>
            Set up Passkey →
          </Link>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            style={{
              padding: "6px 12px",
              background: "transparent",
              border: "1px solid rgba(42,36,28,.15)",
              borderRadius: 3,
              fontSize: "0.75rem",
              color: "var(--mute)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
