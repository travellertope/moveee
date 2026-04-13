"use client";

import { useState, FormEvent } from "react";

export default function GmlCTAForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        letterSpacing: ".12em",
        textTransform: "uppercase",
        color: "var(--ochre)",
        padding: "24px 0",
      }}>
        ✓ Welcome to GetMeLit
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
        disabled={status === "loading"}
      />
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={status === "loading"}
      />
      <button
        type="submit"
        className="gml-signup-submit"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Subscribing…" : "Get Me Lit →"}
      </button>
      {status === "error" && (
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
