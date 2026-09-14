"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  slug: string;
  /** "member" — any free Moveee account/verified email suffices.
   *  "patron" — the verified email must belong to a Moveee Pro member. */
  mode: "member" | "patron";
}

type Stage = "email" | "otp" | "unlocked" | "pro-needed";

/**
 * Moveee Magazine's content gate — the same email/OTP magic-code mechanism
 * built for The Moveee Literary (see LiteraryPieceGate.tsx and
 * lib/literary-access.ts), reused here rather than duplicated: it calls the
 * exact same /api/literary/request-code and /api/literary/verify-code
 * routes (with `context: "magazine"`, which only changes which newsletter
 * list a free verifier joins) and the exact same moveee_lit_token cookie,
 * so a reader who verifies on either /literary or /magazine is unlocked on
 * both. Unlike Literary's public-piece metering, there is no free-read
 * quota here — this always renders as a hard, blocking gate the first time
 * a visitor hits a member-only/patron-only article, matching the site's
 * existing gate behavior.
 *
 * Replaces ArticleContentGate/ContentGate on /magazine only — those
 * components are untouched and still used on /directory and the
 * newsletter reader.
 */
export default function MagazinePieceGate({ slug, mode }: Props) {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainderHtml, setRemainderHtml] = useState("");

  const isPatronGate = mode === "patron";

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
        body: JSON.stringify({ email, code, context: "magazine" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "That code didn't work.");

      if (isPatronGate && json.access !== "pro") {
        setStage("pro-needed");
        return;
      }

      const remainder = await fetch(`/api/magazine/remainder?slug=${encodeURIComponent(slug)}`);
      const remainderJson = await remainder.json();
      if (remainder.ok) setRemainderHtml(remainderJson?.html || "");
      setStage("unlocked");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (stage === "unlocked") {
    return <div className="prose-content" dangerouslySetInnerHTML={{ __html: remainderHtml }} />;
  }

  return (
    <div className={`ar-gate${isPatronGate ? " ar-gate--patron" : ""}`}>
      <div className="ar-gate-header">
        <div className="ar-gate-icon">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: isPatronGate ? "var(--ar-gold)" : "var(--ar-ochre)" }}
          >
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="M21 2L13 10" />
            <path d="M18 5l3 3" />
            <path d="M15 8l1.5 1.5" />
          </svg>
        </div>
        <div className="ar-gate-tier">★ {isPatronGate ? "Moveee Pro" : "Moveee Community"}</div>
      </div>

      {stage === "pro-needed" ? (
        <>
          <h3>Continue reading with Moveee Pro</h3>
          <p>
            That email isn&rsquo;t linked to a Moveee Pro membership — you&rsquo;re on our list
            now, but this piece continues there.
          </p>
          <div className="ar-gate-btns">
            <Link href={`/register?tier=patron&next=/magazine/${slug}`} className="ar-gate-btn-primary">
              Upgrade to Moveee Pro →
            </Link>
          </div>
        </>
      ) : stage === "otp" ? (
        <form onSubmit={verifyCode}>
          <h3>Check your inbox</h3>
          <p>Enter the 6-digit code we sent to {email}.</p>
          <div className="ar-gate-form">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoFocus
              maxLength={6}
              placeholder="000000"
              className="ar-gate-input ar-gate-input--code"
            />
            <button type="submit" disabled={loading || code.length < 6} className="ar-gate-btn-primary">
              {loading ? "Verifying…" : "Continue reading"}
            </button>
          </div>
          {error && <p className="ar-gate-error">{error}</p>}
          <button type="button" className="ar-gate-resend" onClick={() => setStage("email")}>
            Use a different email
          </button>
        </form>
      ) : (
        <form onSubmit={requestCode}>
          <h3>{isPatronGate ? "There's more on the other side." : "This one's for the community."}</h3>
          <p>
            {isPatronGate
              ? "This piece goes deeper — reserved for Moveee Pro members. Enter your email and we'll send a code to confirm your membership."
              : "Enter your email and we'll send a quick code — free, no card needed, forever."}
          </p>
          <div className="ar-gate-form">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="ar-gate-input"
            />
            <button type="submit" disabled={loading} className="ar-gate-btn-primary">
              {loading ? "Sending…" : "Send code"}
            </button>
          </div>
          {error && <p className="ar-gate-error">{error}</p>}
        </form>
      )}

      <p className="ar-gate-footnote">
        {isPatronGate ? "No account needed to verify · Cancel anytime" : "Free · No credit card · No account needed"}
      </p>
    </div>
  );
}
