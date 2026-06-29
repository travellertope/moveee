"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Props {
  list?: string;
  segment?: string;
  buttonLabel?: string;
  successLabel?: string;
}

export default function GmlCTAForm({
  list = "getmelit",
  segment = "",
  buttonLabel = "Get Me Lit →",
  successLabel = "✓ Welcome to GetMeLit",
}: Props) {
  const { status } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (status === "authenticated") {
    return (
      <div className="nl-manage nl-manage--dark" style={{ padding: "8px 0 16px" }}>
        <p className="nl-manage-note">✓ Subscribed as a member</p>
        <Link href="/member/settings" className="nl-manage-btn" style={{ fontSize: "11px" }}>
          Manage Preferences
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, list, segment }),
      });
      if (res.ok) {
        setSubmitStatus("success");
        setName("");
        setEmail("");
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    }
  }

  if (submitStatus === "success") {
    return (
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--ochre)",
        padding: "24px 0",
      }}>
        {successLabel}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <input
        type="text"
        placeholder="First name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitStatus === "loading"}
      />
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={submitStatus === "loading"}
      />
      <button
        type="submit"
        className="gml-signup-submit"
        disabled={submitStatus === "loading"}
      >
        {submitStatus === "loading" ? "Subscribing…" : buttonLabel}
      </button>
      {submitStatus === "error" && (
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          letterSpacing: ".1em",
          color: "var(--ochre)",
          marginTop: "8px",
        }}>
          Something went wrong — try again.
        </p>
      )}
    </form>
  );
}
