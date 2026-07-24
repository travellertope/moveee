"use client";

import { useState, useRef, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ALL_TEMPLATES: { slug: string; label: string; emoji: string; gated?: string }[] = [
  { slug: "post", label: "Update", emoji: "📝" },
  { slug: "hidden-gem", label: "Place", emoji: "💎" },
  { slug: "food-review", label: "Food", emoji: "🍽️" },
  { slug: "book-review", label: "Book", emoji: "📚" },
  { slug: "creative-showcase", label: "Showcase", emoji: "🎨" },
  { slug: "event", label: "Event", emoji: "📅", gated: "Culture Contributor rep (or Pro)" },
  { slug: "poll", label: "Poll", emoji: "📊", gated: "Taste Maker rep (or Pro)" },
  { slug: "itinerary", label: "Itinerary", emoji: "🗺️", gated: "Taste Maker rep (or Pro)" },
];

const DEFAULT_TEMPLATES = ["post"];

export default function CreateHubClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowed, setAllowed] = useState<string[]>(DEFAULT_TEMPLATES);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggle = (slug: string) => {
    setAllowed((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]
    );
  };

  const handleCoverPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/community/upload-image", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setError(data?.error || "Could not upload that image.");
      } else {
        setCoverImageUrl(data.url);
      }
    } catch {
      setError("Could not upload that image.");
    }
    setUploadingCover(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/hub/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          allowed_templates: allowed.length ? allowed : DEFAULT_TEMPLATES,
          cover_image_url: coverImageUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not start a Hub right now.");
        setSubmitting(false);
        return;
      }
      router.push(`/hub/${data.slug}`);
    } catch {
      setError("Could not start a Hub right now.");
      setSubmitting(false);
    }
  };

  return (
    <div className="hfc-page">
      <div className="hfc-header">
        <div className="hfc-header-inner">
          <Link href="/hub" className="hfc-back">← Back</Link>
          <span className="hfc-step-label">Start a Hub</span>
        </div>
      </div>

      <div className="hfc-body">
        <div className="hfc-step">
          <h1 className="hfc-heading">Start a Hub.</h1>
          <p className="hfc-sub">
            A Hub is a topic community — anyone can join, post, and comment on what
            they love. Give it a name, a short description, and choose what people
            can post there.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="hfc-label" htmlFor="hub-name">Hub name</label>
            <input
              id="hub-name"
              type="text"
              className="hfc-input"
              required
              placeholder="e.g. Afrobeats Heads"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />

            <label className="hfc-label" htmlFor="hub-desc">Description</label>
            <textarea
              id="hub-desc"
              className="hfc-textarea"
              rows={3}
              required
              placeholder="What's this Hub about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />

            <label className="hfc-label" htmlFor="hub-cover">Cover image (optional)</label>
            <input
              id="hub-cover"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleCoverPick}
              disabled={submitting || uploadingCover}
              style={{ marginBottom: 12 }}
            />
            {uploadingCover && <p className="hfc-capacity-hint">Uploading…</p>}
            {coverImageUrl && !uploadingCover && (
              <img
                src={coverImageUrl}
                alt=""
                style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: "var(--radius-lg, 6px)", marginBottom: 12 }}
              />
            )}

            <p className="hfc-label" style={{ marginTop: 20 }}>What can members post?</p>
            <div className="hfc-venue-grid">
              {ALL_TEMPLATES.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  className={`hfc-venue-chip${allowed.includes(t.slug) ? " hfc-venue-chip--active" : ""}`}
                  onClick={() => toggle(t.slug)}
                  title={t.gated ? `Members will still need ${t.gated} to use this template.` : undefined}
                >
                  <span className="hfc-venue-icon">{t.emoji}</span>
                  <span className="hfc-venue-label">
                    {t.label}{t.gated ? " 🔒" : ""}
                  </span>
                </button>
              ))}
            </div>
            <p className="hfc-capacity-hint">
              🔒 = members will still need the required reputation tier (or Moveee Pro) to
              use that template, even when it's allowed here.
            </p>

            {error && <p className="hfc-error">{error}</p>}

            <button
              type="submit"
              className="hfc-submit-btn"
              disabled={submitting || !name.trim() || !description.trim()}
            >
              {submitting ? "Starting…" : "Start Hub →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
