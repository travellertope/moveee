"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// Mirrors Culture_Literary_Submissions::SECTIONS in
// culture-community/includes/admin/class-culture-literary-submissions.php —
// no shared source of truth across the PHP/TS boundary, same caveat as every
// other duplicated constant in this codebase. If the fee or terms ever
// change there, update this map too.
const SECTIONS: Record<string, { label: string; fee: number; paymentLabel: string }> = {
  fiction:       { label: "Fiction",         fee: 3, paymentLabel: "$15–$25" },
  poetry:        { label: "Poetry",          fee: 3, paymentLabel: "$15–$25" },
  essays:        { label: "Essays",          fee: 3, paymentLabel: "$15–$25" },
  conversations: { label: "Conversations",   fee: 3, paymentLabel: "$15–$25" },
  translation:   { label: "In Translation",  fee: 3, paymentLabel: "$15–$25" },
  notes:         { label: "Notes",           fee: 3, paymentLabel: "$15–$25" },
  flash:         { label: "The Moveee Flash", fee: 0, paymentLabel: "$10 flat" },
};

type Status = "form" | "submitting" | "waiting_payment" | "confirmed" | "cancelled" | "failed";

export default function LiterarySubmitNewPage() {
  const [status, setStatus] = useState<Status>("form");
  const [error, setError] = useState<string>("");

  const [writerName, setWriterName] = useState("");
  const [writerEmail, setWriterEmail] = useState("");
  const [section, setSection] = useState("fiction");
  const [title, setTitle] = useState("");
  const [waiverCode, setWaiverCode] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);

  const sectionMeta = SECTIONS[section] ?? SECTIONS.fiction;
  const needsFee = sectionMeta.fee > 0;

  // Handle the return trip from Paystack/Stripe.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmed = params.get("submission_confirmed");
    const pending = params.get("submission_pending");
    const failed = params.get("submission_failed");
    const cancelled = params.get("submission_cancelled");

    if (confirmed) {
      setStatus("confirmed");
      return;
    }
    if (failed) {
      setStatus("failed");
      return;
    }
    if (cancelled) {
      setStatus("cancelled");
      return;
    }
    if (pending) {
      setStatus("waiting_payment");
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts += 1;
        try {
          const res = await fetch(`/api/literary/submission/status?code=${encodeURIComponent(pending)}`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (data?.status === "confirmed") {
            clearInterval(poll);
            setStatus("confirmed");
          }
        } catch {
          // keep polling
        }
        if (attempts >= 40) {
          clearInterval(poll);
          setStatus("failed");
        }
      }, 3000);
      return () => clearInterval(poll);
    }
  }, []);

  const exec = (cmd: "bold" | "italic") => {
    editorRef.current?.focus();
    document.execCommand(cmd);
  };

  const canSubmit = useMemo(() => {
    return writerName.trim().length > 0 && /\S+@\S+\.\S+/.test(writerEmail) && !!section;
  }, [writerName, writerEmail, section]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const content = editorRef.current?.innerHTML?.trim() ?? "";
    if (!content || content === "<br>") {
      setError("Please paste your piece before submitting.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/literary/submission/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          writerName,
          writerEmail,
          section,
          title,
          content,
          waiverCode: needsFee ? waiverCode : "",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.message ?? "Something went wrong. Please try again.");
        setStatus("form");
        return;
      }

      if (data.status === "confirmed") {
        setStatus("confirmed");
      } else if (data.status === "payment_required" && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError("Something went wrong. Please try again.");
        setStatus("form");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("form");
    }
  }

  if (status === "confirmed") {
    return (
      <div className="lit-submit-wrap">
        <h1>It&rsquo;s In.</h1>
        <p className="lit-sub">Thank you for sending us your work.</p>
        <div className="lit-submit-body">
          <p>
            We&rsquo;ve received your submission and it&rsquo;s now in our reading queue. We read
            every submission blindly, on its own terms, and will follow up by email once a
            decision has been made.
          </p>
          <p>
            <Link href="/literary">Browse The Moveee Literary &rarr;</Link>
          </p>
        </div>
      </div>
    );
  }

  if (status === "waiting_payment") {
    return (
      <div className="lit-submit-wrap">
        <h1>Confirming Payment&hellip;</h1>
        <p className="lit-sub">This only takes a moment.</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="lit-submit-wrap">
        <h1>Payment Didn&rsquo;t Go Through.</h1>
        <p className="lit-sub">Nothing was charged.</p>
        <div className="lit-submit-body">
          <p>
            <Link href="/literary/submit/new">Try again &rarr;</Link> or email{" "}
            <a href="mailto:literary@themoveee.com">literary@themoveee.com</a> if this keeps
            happening.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="lit-submit-wrap">
      <h1>Submit Your Work</h1>
      <p className="lit-sub">Paste your finished piece below.</p>

      {status === "cancelled" && (
        <p className="lit-form-notice">Payment was cancelled — nothing was charged. Your form is still filled in below.</p>
      )}

      <form className="lit-form" onSubmit={handleSubmit}>
        <div className="lit-form-field">
          <label htmlFor="lit-writer-name">Your name</label>
          <input
            id="lit-writer-name"
            type="text"
            value={writerName}
            onChange={(e) => setWriterName(e.target.value)}
            required
          />
        </div>

        <div className="lit-form-field">
          <label htmlFor="lit-writer-email">Your email</label>
          <input
            id="lit-writer-email"
            type="email"
            value={writerEmail}
            onChange={(e) => setWriterEmail(e.target.value)}
            required
          />
        </div>

        <div className="lit-form-field">
          <label htmlFor="lit-section">Section</label>
          <select id="lit-section" value={section} onChange={(e) => setSection(e.target.value)}>
            {Object.entries(SECTIONS).map(([slug, meta]) => (
              <option key={slug} value={slug}>
                {meta.label}
              </option>
            ))}
          </select>
          <p className="lit-form-hint">
            {needsFee
              ? `$3 submission fee · pays ${sectionMeta.paymentLabel} if accepted.`
              : `No submission fee · pays ${sectionMeta.paymentLabel} if accepted.`}
          </p>
        </div>

        <div className="lit-form-field">
          <label htmlFor="lit-title">Piece title (optional)</label>
          <input id="lit-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="lit-form-field">
          <label>Your piece</label>
          <div className="lit-form-toolbar">
            <button type="button" onClick={() => exec("bold")} aria-label="Bold">
              <strong>B</strong>
            </button>
            <button type="button" onClick={() => exec("italic")} aria-label="Italic">
              <em>I</em>
            </button>
          </div>
          <div
            id="lit-content"
            ref={editorRef}
            className="lit-form-editor"
            contentEditable
            suppressContentEditableWarning
            data-placeholder="Paste your finished piece here — no need to include your name, we read blindly."
          />
        </div>

        {needsFee && (
          <div className="lit-form-field">
            <label htmlFor="lit-waiver">Waiver code (optional)</label>
            <input
              id="lit-waiver"
              type="text"
              value={waiverCode}
              onChange={(e) => setWaiverCode(e.target.value)}
              placeholder="Leave blank to pay the $3 fee"
            />
            <p className="lit-form-hint">
              Can&rsquo;t afford the fee? Email{" "}
              <a href="mailto:literary@themoveee.com">literary@themoveee.com</a> to request a
              waiver code.
            </p>
          </div>
        )}

        {error && <p className="lit-form-error">{error}</p>}

        <button type="submit" className="lit-form-submit" disabled={!canSubmit || status === "submitting"}>
          {status === "submitting" ? "Submitting…" : needsFee ? "Continue to Payment →" : "Submit →"}
        </button>
      </form>
    </div>
  );
}
