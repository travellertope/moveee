"use client";

import { useState } from "react";

interface Props {
  slug: string;
  /** "meter" — a free piece past the anonymous read quota. "pro" — a Pro-only piece. */
  mode: "meter" | "pro";
  /**
   * true: this box IS the cut point — nothing past it exists in the DOM
   * yet, so a successful verify fetches the withheld remainder via AJAX.
   * false: a non-blocking nudge — the rest of the piece is already fully
   * rendered below it; verifying just dismisses the box.
   */
  blocking: boolean;
}

type Stage = "email" | "otp" | "unlocked" | "dismissed" | "pro-needed";

/**
 * The Moveee Literary's "join the club" email/OTP box — see the Literary
 * gating notes in CLAUDE.md. Renders inline at ~30% into a piece, disappears
 * entirely for logged-in readers (the parent page never mounts this
 * component for them at all, so there's nothing to hide here).
 *
 * The email → OTP swap happens in place (no navigation), and on success the
 * remainder of the article is fetched and injected right where this box
 * sits — no page reload, so scroll position/reading state never resets.
 */
export default function LiteraryPieceGate({ slug, mode, blocking }: Props) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainderHtml, setRemainderHtml] = useState("");

  if (stage === "dismissed") return null;

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/literary/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Couldn't send a code.");
      setStage("otp");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/literary/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "That code didn't work.");

      if (mode === "pro" && json.access !== "pro") {
        setStage("pro-needed");
        return;
      }

      if (blocking) {
        const remainder = await fetch(`/api/literary/remainder?slug=${encodeURIComponent(slug)}`);
        const remainderJson = await remainder.json();
        if (remainder.ok) setRemainderHtml(remainderJson?.html || "");
      }
      setStage("unlocked");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "unlocked") {
    if (!blocking) return null;
    return <div className="lit-gate-remainder" dangerouslySetInnerHTML={{ __html: remainderHtml }} />;
  }

  return (
    <div className={`lit-email-gate${blocking ? " lit-email-gate--blocking" : ""}`}>
      <div className="lit-gate-eyebrow">★ The Moveee Literary</div>
      {stage === "pro-needed" ? (
        <div>
          <h3>This piece continues in Moveee Pro</h3>
          <p>
            That email isn&rsquo;t linked to a Moveee Pro membership — you&rsquo;re on The Moveee
            Literary Club list now, but this piece continues there.
          </p>
          <a className="lit-btn-pill lit-btn-pill--fill" href={`/register?tier=patron&next=/literary/${slug}`}>
            Upgrade to Moveee Pro →
          </a>
        </div>
      ) : stage === "otp" ? (
        <form onSubmit={verifyCode}>
          <h3>Check your inbox</h3>
          <p>Enter the 6-digit code we sent to {email}.</p>
          <div className="lit-nl-form lit-email-gate-form">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="000000"
              className="lit-email-gate-input lit-email-gate-input--code"
            />
            <button type="submit" disabled={loading || code.length < 6} className="lit-email-gate-btn">
              {loading ? "Verifying…" : "Continue reading"}
            </button>
          </div>
          {error && <p className="lit-gate-error">{error}</p>}
          <button type="button" className="lit-gate-resend" onClick={() => setStage("email")}>
            Use a different email
          </button>
        </form>
      ) : (
        <form onSubmit={requestCode}>
          <h3>
            {blocking
              ? mode === "pro"
                ? "Continue reading The Moveee Literary"
                : "You've reached this month's free reading"
              : "Join The Moveee Literary Club"}
          </h3>
          <p>
            {blocking
              ? mode === "pro"
                ? "Enter your email and we'll send a code to confirm your Moveee Pro membership."
                : "Enter your email for a code, then continue reading — free, no charge."
              : "New fiction, poetry, essays and translation, as we publish it — enter your email for a quick code."}
          </p>
          <div className="lit-nl-form lit-email-gate-form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="lit-email-gate-input"
            />
            <button type="submit" disabled={loading} className="lit-email-gate-btn">
              {loading ? "Sending…" : "Send code"}
            </button>
          </div>
          {error && <p className="lit-gate-error">{error}</p>}
          {!blocking && (
            <button type="button" className="lit-gate-skip" onClick={() => setStage("dismissed")}>
              Skip for now
            </button>
          )}
        </form>
      )}
    </div>
  );
}
