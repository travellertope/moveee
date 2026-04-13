"use client";

import { useState } from "react";
import Link from "next/link";

const ENTRY_TYPES = [
  { slug: "person", label: "Person" },
  { slug: "place", label: "Place" },
  { slug: "movement", label: "Movement" },
  { slug: "genre", label: "Genre" },
  { slug: "concept", label: "Concept" },
  { slug: "artwork", label: "Artwork" },
  { slug: "food", label: "Food & Drink" },
  { slug: "fashion", label: "Fashion" },
] as const;

type Step = "input" | "generating" | "review" | "submitting" | "done";

interface Props {
  isLoggedIn: boolean;
}

export default function DirectorySubmitForm({ isLoggedIn }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");

  // Editable stub fields
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState<string>("concept");
  const [pointsAwarded, setPointsAwarded] = useState(0);

  // Not logged in — show auth gate
  if (!isLoggedIn) {
    return (
      <div className="dir-submit-wrap">
        <Link href="/directory" className="dir-back">
          ← Culture Directory
        </Link>
        <div className="dir-submit-auth-gate">
          <div className="dir-eyebrow">★ Culture Directory</div>
          <h2>Sign in to contribute</h2>
          <p>
            You need a Moveee account to submit directory entries and earn
            culture points.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/login?redirect=/directory/submit"
              className="dir-submit-btn"
            >
              Sign in →
            </Link>
            <Link href="/register" className="dir-secondary-btn">
              Create free account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setStep("generating");
    setError("");

    try {
      const res = await fetch("/api/directory/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Generation failed");
      }

      const stub = await res.json();
      setTitle(stub.title ?? topic);
      setExcerpt(stub.excerpt ?? "");
      setContent(stub.content ?? "");
      setEntryType(stub.entryType ?? "concept");
      setStep("review");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setStep("input");
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;
    setStep("submitting");
    setError("");

    try {
      const res = await fetch("/api/directory/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim(),
          content: content.trim(),
          entryType,
          aiGenerated: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }

      const data = await res.json();
      setPointsAwarded(data.points_awarded ?? 25);
      setStep("done");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
      setStep("review");
    }
  }

  function handleReset() {
    setStep("input");
    setTopic("");
    setTitle("");
    setExcerpt("");
    setContent("");
    setEntryType("concept");
    setError("");
    setPointsAwarded(0);
  }

  return (
    <div className="dir-submit-wrap">
      {/* Header */}
      <div className="dir-submit-header">
        <Link href="/directory" className="dir-back">
          ← Culture Directory
        </Link>
        <div className="dir-eyebrow">★ Community Contribution</div>
        <h1 className="dir-submit-heading">Add a Directory Entry</h1>
        <p className="dir-submit-desc">
          Type a name or topic below. Gemini AI will draft a starter entry —
          review and edit it before submitting. Every approved entry earns you
          culture points.
        </p>
      </div>

      {/* ── Step: Input / Generating ── */}
      {(step === "input" || step === "generating") && (
        <div className="dir-generate-section">
          <label className="dir-field-label" htmlFor="dir-topic">
            Name or topic
          </label>
          <div className="dir-generate-row">
            <input
              id="dir-topic"
              type="text"
              className="dir-topic-input"
              placeholder="e.g. Fela Kuti, Highlife music, Lagos Island, Ankara fabric…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && step === "input" && handleGenerate()
              }
              disabled={step === "generating"}
              autoFocus
            />
            <button
              className="dir-generate-btn"
              onClick={handleGenerate}
              disabled={step === "generating" || !topic.trim()}
            >
              {step === "generating" ? "Generating…" : "Generate with AI →"}
            </button>
          </div>
          {error && <p className="dir-error">{error}</p>}
          <p className="dir-generate-note">
            ★ Earn 25 culture points when your entry is approved
          </p>
        </div>
      )}

      {/* ── Step: Review & Edit ── */}
      {(step === "review" || step === "submitting") && (
        <div className="dir-review-section">
          <div className="dir-review-notice">
            AI-generated stub — review and edit before submitting. Your
            corrections and additions are welcome.
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-title">
              Title
            </label>
            <input
              id="dir-title"
              type="text"
              className="dir-field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={step === "submitting"}
            />
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-entry-type">
              Entry type
            </label>
            <select
              id="dir-entry-type"
              className="dir-field-input"
              value={entryType}
              onChange={(e) => setEntryType(e.target.value)}
              disabled={step === "submitting"}
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-excerpt">
              Summary <span style={{ fontWeight: 400, opacity: 0.6 }}>(1–2 sentences, plain text)</span>
            </label>
            <textarea
              id="dir-excerpt"
              className="dir-field-textarea"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              disabled={step === "submitting"}
            />
          </div>

          <div className="dir-field">
            <label className="dir-field-label" htmlFor="dir-content">
              Full entry{" "}
              <span style={{ fontWeight: 400, opacity: 0.6 }}>
                (HTML — uses &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt; tags)
              </span>
            </label>
            <textarea
              id="dir-content"
              className="dir-field-textarea dir-field-textarea--tall"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={step === "submitting"}
            />
          </div>

          {error && <p className="dir-error">{error}</p>}

          <div className="dir-review-actions">
            <button
              className="dir-submit-btn"
              onClick={handleSubmit}
              disabled={
                step === "submitting" ||
                !title.trim() ||
                !excerpt.trim() ||
                !content.trim()
              }
            >
              {step === "submitting" ? "Submitting…" : "Submit for Review →"}
            </button>
            <button
              className="dir-secondary-btn"
              onClick={handleReset}
              disabled={step === "submitting"}
            >
              ← Start over
            </button>
          </div>
        </div>
      )}

      {/* ── Step: Done ── */}
      {step === "done" && (
        <div className="dir-success">
          <div className="dir-success-icon">✓</div>
          <h2>Entry submitted!</h2>
          <p>
            Your entry is pending editorial review. Once approved, it will
            appear in the Culture Directory.
          </p>
          <div className="dir-success-points">
            +{pointsAwarded} culture points earned
          </div>
          <div className="dir-review-actions" style={{ justifyContent: "center" }}>
            <Link href="/directory" className="dir-submit-btn">
              Browse the Directory →
            </Link>
            <button className="dir-secondary-btn" onClick={handleReset}>
              Add another entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
