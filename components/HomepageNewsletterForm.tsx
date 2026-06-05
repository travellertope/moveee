"use client";

import { useState, FormEvent } from "react";

export default function HomepageNewsletterForm() {
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
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className="hp-nl-cta-success">✓ You&rsquo;re on the list — see you Tuesday.</p>
    );
  }

  return (
    <form className="hp-nl-cta-form" onSubmit={handleSubmit} noValidate>
      <input
        type="email"
        placeholder="Enter your email address"
        aria-label="Newsletter email address"
        className="hp-nl-cta-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        required
      />
      <button type="submit" className="hp-nl-cta-btn" disabled={status === "loading"}>
        {status === "loading" ? "Subscribing…" : "Drop it in my inbox →"}
      </button>
      {status === "error" && (
        <span className="hp-nl-cta-error">Something went wrong — try again.</span>
      )}
    </form>
  );
}
