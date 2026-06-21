"use client";

import { useState, FormEvent } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function WaitlistModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list: "culture-drop" }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mz-modal-overlay" onClick={onClose}>
      <div className="mz-modal" onClick={(e) => e.stopPropagation()}>
        <button className="mz-modal-close" onClick={onClose} aria-label="Close">×</button>
        <p className="mz-eyebrow">Join Moveee</p>
        <h3 className="mz-modal-h3">The app isn&apos;t live yet.</h3>
        <p className="mz-modal-body">
          Moveee for iOS and Android is coming soon. Drop your email and we&apos;ll let you know
          the moment it launches.
        </p>
        {status === "success" ? (
          <p className="mz-modal-success">✓ You&rsquo;re on the list — we&rsquo;ll be in touch.</p>
        ) : (
          <form className="mz-modal-form" onSubmit={handleSubmit} noValidate>
            <input
              type="email"
              placeholder="Enter your email address"
              aria-label="Waitlist email address"
              className="mz-modal-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              required
            />
            <button type="submit" className="mz-btn-primary" disabled={status === "loading"}>
              {status === "loading" ? "Joining…" : "Join the waitlist"}
            </button>
            {status === "error" && (
              <span className="mz-modal-error">Something went wrong — try again.</span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
