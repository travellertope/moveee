"use client";

import { useState, FormEvent } from "react";

interface Props {
  label: string;
}

export default function GmlWaitlistForm({ label }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list: label }),
      });
    } catch {
      // optimistic
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--ochre)",
        padding: "12px 0",
      }}>
        ✓ You&apos;re on the list
      </p>
    );
  }

  return (
    <form className="gml-waitlist" onSubmit={handleSubmit} noValidate>
      <input
        type="email"
        placeholder="Join the waitlist"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
      />
      <button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "…" : "Notify →"}
      </button>
    </form>
  );
}
