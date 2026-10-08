"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";

export type ComposerTab = "update" | "review" | "art" | "poll" | "quote" | "itinerary" | "event";
type ReviewSubtype = "place" | "food" | "music" | "book" | "film";

const REVIEW_TEMPLATE: Record<ReviewSubtype, string> = {
  place: "hidden-gem",
  food: "food-review",
  music: "music-review",
  book: "book-review",
  film: "film-review",
};

const CATEGORIES = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"];

const TABS: { key: ComposerTab; label: string; icon: string }[] = [
  { key: "update",    label: "Update",       icon: "✏️" },
  { key: "review",    label: "Review",       icon: "⭐" },
  { key: "art",       label: "Art / Showcase", icon: "🎨" },
  { key: "poll",      label: "Poll",         icon: "📊" },
  { key: "quote",     label: "Quote",        icon: "💬" },
  { key: "itinerary", label: "Itinerary",    icon: "🗺️" },
  { key: "event",     label: "Event",        icon: "📅" },
];

interface Stop {
  id: string;
  name: string;
  location: string;
  note: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: ComposerTab;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="cm-stars" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`cm-star${n <= (hovered || value) ? " cm-star--active" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ImageUpload({ url, onUpload, onRemove, uploading }: {
  url: string; onUpload: (f: File) => void; onRemove: () => void; uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  function handleFiles(files: FileList | null) {
    if (files?.[0]) onUpload(files[0]);
  }
  return (
    <div
      className={`cm-upload-zone${url ? " cm-upload-zone--has-image" : ""}`}
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      onClick={() => !url && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
      />
      {url ? (
        <div className="cm-upload-preview">
          <img src={url} alt="Upload preview" />
          <button
            type="button"
            className="cm-upload-preview-remove"
            onClick={e => { e.stopPropagation(); onRemove(); }}
            aria-label="Remove image"
          >✕</button>
        </div>
      ) : (
        <div className="cm-upload-hint">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="m21 15-5-5L5 21"/>
          </svg>
          <span className="cm-upload-hint-title">{uploading ? "Uploading…" : "Add a photo"}</span>
          <span className="cm-upload-hint-sub">Click or drag &amp; drop</span>
        </div>
      )}
    </div>
  );
}

export default function ComposerModal({ open, onClose, onSuccess, initialTab = "update" }: Props) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ComposerTab>(initialTab);

  // Update
  const [updTitle, setUpdTitle] = useState("");
  const [updContent, setUpdContent] = useState("");

  // Review
  const [revSubtype, setRevSubtype] = useState<ReviewSubtype>("place");
  const [revTitle, setRevTitle]     = useState("");
  const [revRating, setRevRating]   = useState(5);
  const [revContent, setRevContent] = useState("");

  // Art
  const [artTitle, setArtTitle]     = useState("");
  const [artContent, setArtContent] = useState("");

  // Poll
  const [pollQ, setPollQ]           = useState("");
  const [pollOpts, setPollOpts]     = useState(["", ""]);

  // Quote
  const [qText, setQText]           = useState("");
  const [qAuthor, setQAuthor]       = useState("");
  const [qSource, setQSource]       = useState("");
  const [qReflection, setQReflection] = useState("");

  // Itinerary
  const [iTitle, setITitle]         = useState("");
  const [iOverview, setIOverview]   = useState("");
  const [stops, setStops]           = useState<Stop[]>([
    { id: "a", name: "", location: "", note: "" },
    { id: "b", name: "", location: "", note: "" },
  ]);

  // Event
  const [evTitle, setEvTitle]       = useState("");
  const [evDate, setEvDate]         = useState("");
  const [evEndDate, setEvEndDate]   = useState("");
  const [evVenue, setEvVenue]       = useState("");
  const [evCity, setEvCity]         = useState("");
  const [evDesc, setEvDesc]         = useState("");
  const [evAdmission, setEvAdmission] = useState("");
  const [evTicketUrl, setEvTicketUrl] = useState("");

  // Shared
  const [category, setCategory]     = useState("Music");
  const [imageUrl, setImageUrl]     = useState("");
  const [uploading, setUploading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  // Sync initialTab when it changes (star button sets review)
  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab]);

  const resetAll = useCallback(() => {
    setUpdTitle(""); setUpdContent("");
    setRevTitle(""); setRevContent(""); setRevRating(5); setRevSubtype("place");
    setArtTitle(""); setArtContent("");
    setPollQ(""); setPollOpts(["", ""]);
    setQText(""); setQAuthor(""); setQSource(""); setQReflection("");
    setITitle(""); setIOverview("");
    setStops([{ id: "a", name: "", location: "", note: "" }, { id: "b", name: "", location: "", note: "" }]);
    setEvTitle(""); setEvDate(""); setEvEndDate(""); setEvVenue(""); setEvCity("");
    setEvDesc(""); setEvAdmission(""); setEvTicketUrl("");
    setImageUrl(""); setError("");
  }, []);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/community/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImageUrl(data.url);
    } catch (e: any) {
      setError(e.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      if (activeTab === "quote") {
        if (!qText.trim() || !qAuthor.trim()) throw new Error("Quote text and author are required");
        const res = await fetch("/api/quotes/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: qText.trim(),
            author: qAuthor.trim(),
            source: qSource.trim() || undefined,
            sharing_reason: qReflection.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post quote");
      } else {
        let template_type = "";
        const payload: Record<string, unknown> = { tag: category };

        if (activeTab === "update") {
          template_type = "post";
          if (!updContent.trim()) throw new Error("Post content is required");
          payload.text = updTitle.trim() ? `${updTitle.trim()}\n\n${updContent.trim()}` : updContent.trim();
          if (imageUrl) payload.imageUrl = imageUrl;
        } else if (activeTab === "review") {
          template_type = REVIEW_TEMPLATE[revSubtype];
          if (!revContent.trim()) throw new Error("Review content is required");
          if (revSubtype === "place") {
            payload.location_name = revTitle.trim();
            payload.text = revContent.trim();
          } else {
            payload.text = revTitle.trim() ? `${revTitle.trim()}\n\n${revContent.trim()}` : revContent.trim();
          }
          payload.star_rating = revRating;
          if (imageUrl) payload.imageUrl = imageUrl;
        } else if (activeTab === "art") {
          template_type = "creative-showcase";
          if (!artContent.trim()) throw new Error("Description is required");
          payload.text = artTitle.trim() ? `${artTitle.trim()}\n\n${artContent.trim()}` : artContent.trim();
          if (imageUrl) payload.imageUrl = imageUrl;
        } else if (activeTab === "poll") {
          template_type = "poll";
          if (!pollQ.trim()) throw new Error("Poll question is required");
          const opts = pollOpts.filter(o => o.trim());
          if (opts.length < 2) throw new Error("Add at least 2 poll options");
          payload.text = pollQ.trim();
          payload.poll_options = opts.map(o => ({ text: o.trim() }));
        } else if (activeTab === "itinerary") {
          template_type = "itinerary";
          if (!iOverview.trim()) throw new Error("Overview is required");
          payload.text = iTitle.trim() ? `${iTitle.trim()}\n\n${iOverview.trim()}` : iOverview.trim();
          const validStops = stops.filter(s => s.name.trim());
          if (validStops.length === 0) throw new Error("Add at least one stop");
          payload.itinerary_stops = validStops.map(s => ({
            name: s.name.trim(),
            lat: 0,
            lng: 0,
            note: [s.location.trim(), s.note.trim()].filter(Boolean).join(" — "),
            image_url: "",
          }));
        } else if (activeTab === "event") {
          template_type = "happening";
          if (!evTitle.trim()) throw new Error("Event title is required");
          if (!evDate) throw new Error("Event date is required");
          payload.text = evDesc.trim() || evTitle.trim();
          payload.event_title = evTitle.trim();
          payload.event_date = evDate;
          if (evEndDate) payload.event_end_date = evEndDate;
          payload.event_venue = evVenue.trim();
          payload.event_city = evCity.trim();
          payload.event_address = evVenue.trim();
          payload.event_admission = evAdmission.trim() || "Free";
          if (evTicketUrl.trim()) payload.ticket_url = evTicketUrl.trim();
          payload.rsvp_enabled = false;
          if (imageUrl) payload.imageUrl = imageUrl;
        }

        payload.template_type = template_type;

        const res = await fetch("/api/community/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post");
      }

      resetAll();
      onClose();
      onSuccess?.();
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  if (!open) return null;

  const tabLabel = TABS.find(t => t.key === activeTab)?.label ?? "Post";

  return (
    <div className="cm-backdrop" role="dialog" aria-modal="true" aria-label="Create post" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="cm-card">

        {/* Header */}
        <div className="cm-header">
          <div className="cm-header-title">
            <span className="cm-title">Create Post</span>
            <span className="cm-type-badge">{tabLabel}</span>
          </div>
          <button type="button" className="cm-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Tab strip */}
        <div className="cm-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`cm-tab${activeTab === tab.key ? " cm-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="cm-body">
          {error && <p className="cm-error">{error}</p>}

          {/* ── UPDATE ── */}
          {activeTab === "update" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Title <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="Give your post a title…"
                  value={updTitle}
                  onChange={e => setUpdTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">What&rsquo;s on your mind?</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Share what's happening in culture right now…"
                  value={updContent}
                  onChange={e => setUpdContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Visual <span className="cm-label-opt">(optional)</span></label>
                <ImageUpload url={imageUrl} onUpload={handleImageUpload} onRemove={() => setImageUrl("")} uploading={uploading} />
              </div>
            </>
          )}

          {/* ── REVIEW ── */}
          {activeTab === "review" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Review type</label>
                <div className="cm-review-pills">
                  {(["place", "food", "music", "book", "film"] as ReviewSubtype[]).map(sub => (
                    <button
                      key={sub}
                      type="button"
                      className={`cm-pill${revSubtype === sub ? " cm-pill--active" : ""}`}
                      onClick={() => setRevSubtype(sub)}
                    >
                      {{ place: "📍 Place", food: "🍽 Food", music: "🎵 Music", book: "📚 Book", film: "🎬 Film" }[sub]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">
                  {{ place: "Place name", food: "Restaurant / dish", music: "Artist / album / track", book: "Book title", film: "Film title" }[revSubtype]}
                </label>
                <input
                  className="cm-input"
                  placeholder={
                    { place: "Name of the place…", food: "e.g. Suya Spot Lagos, jollof rice", music: "e.g. Fela Kuti – Zombie", book: "e.g. Homegoing by Yaa Gyasi", film: "e.g. Moonlight (2016)" }[revSubtype]
                  }
                  value={revTitle}
                  onChange={e => setRevTitle(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Your rating</label>
                <StarRating value={revRating} onChange={setRevRating} />
              </div>
              <div className="cm-field">
                <label className="cm-label">Your review</label>
                <textarea
                  className="cm-textarea"
                  placeholder={
                    { place: "What makes it worth visiting?", food: "How was the taste, vibe, value?", music: "What does this make you feel?", book: "What stayed with you?", film: "What made it memorable?" }[revSubtype]
                  }
                  value={revContent}
                  onChange={e => setRevContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Cover photo <span className="cm-label-opt">(optional)</span></label>
                <ImageUpload url={imageUrl} onUpload={handleImageUpload} onRemove={() => setImageUrl("")} uploading={uploading} />
              </div>
            </>
          )}

          {/* ── ART / SHOWCASE ── */}
          {activeTab === "art" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Artwork title <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="Name of the piece or project…"
                  value={artTitle}
                  onChange={e => setArtTitle(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Curator&rsquo;s note</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Tell us about this work — the concept, the process, what inspired it…"
                  value={artContent}
                  onChange={e => setArtContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Visual</label>
                <ImageUpload url={imageUrl} onUpload={handleImageUpload} onRemove={() => setImageUrl("")} uploading={uploading} />
              </div>
            </>
          )}

          {/* ── POLL ── */}
          {activeTab === "poll" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Your question</label>
                <input
                  className="cm-input"
                  placeholder="Ask the community something…"
                  value={pollQ}
                  onChange={e => setPollQ(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Options</label>
                <div className="cm-poll-options">
                  {pollOpts.map((opt, i) => (
                    <div key={i} className="cm-poll-opt-row">
                      <input
                        className="cm-input"
                        placeholder={`Option ${i + 1}…`}
                        value={opt}
                        onChange={e => {
                          const next = [...pollOpts];
                          next[i] = e.target.value;
                          setPollOpts(next);
                        }}
                      />
                      {pollOpts.length > 2 && (
                        <button
                          type="button"
                          className="cm-poll-remove"
                          onClick={() => setPollOpts(pollOpts.filter((_, j) => j !== i))}
                          aria-label="Remove option"
                        >✕</button>
                      )}
                    </div>
                  ))}
                  {pollOpts.length < 5 && (
                    <button
                      type="button"
                      className="cm-add-btn"
                      onClick={() => setPollOpts([...pollOpts, ""])}
                    >
                      <span aria-hidden="true">＋</span> Add option
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── QUOTE ── */}
          {activeTab === "quote" && (
            <>
              <div className="cm-field">
                <label className="cm-label">The quote</label>
                <textarea
                  className="cm-textarea cm-textarea--serif"
                  placeholder='"The quote that moved you…"'
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Who said it?</label>
                  <input
                    className="cm-input"
                    placeholder="e.g. Toni Morrison"
                    value={qAuthor}
                    onChange={e => setQAuthor(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">Source <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    placeholder="e.g. Beloved, 1987"
                    value={qSource}
                    onChange={e => setQSource(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Why does this resonate? <span className="cm-label-opt">(optional)</span></label>
                <textarea
                  className="cm-textarea"
                  placeholder="Share why this quote stayed with you…"
                  value={qReflection}
                  onChange={e => setQReflection(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* ── ITINERARY ── */}
          {activeTab === "itinerary" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Itinerary title</label>
                <input
                  className="cm-input"
                  placeholder="e.g. 48 Hours in Lagos"
                  value={iTitle}
                  onChange={e => setITitle(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Overview / tagline</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Set the scene — who's this for, what's the vibe?"
                  value={iOverview}
                  onChange={e => setIOverview(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Stops</label>
                <div className="cm-stops">
                  {stops.map((stop, i) => (
                    <div key={stop.id} className="cm-stop-card">
                      <div className="cm-stop-header">
                        <span className="cm-stop-num">Stop {i + 1}</span>
                        {stops.length > 1 && (
                          <button
                            type="button"
                            className="cm-poll-remove"
                            onClick={() => setStops(stops.filter(s => s.id !== stop.id))}
                            aria-label="Remove stop"
                          >✕</button>
                        )}
                      </div>
                      <input
                        className="cm-input"
                        placeholder="Stop name / place…"
                        value={stop.name}
                        onChange={e => setStops(stops.map(s => s.id === stop.id ? { ...s, name: e.target.value } : s))}
                      />
                      <input
                        className="cm-input"
                        placeholder="Address or neighbourhood (optional)…"
                        value={stop.location}
                        onChange={e => setStops(stops.map(s => s.id === stop.id ? { ...s, location: e.target.value } : s))}
                      />
                      <textarea
                        className="cm-textarea"
                        placeholder="Tips, notes, what to do here…"
                        value={stop.note}
                        onChange={e => setStops(stops.map(s => s.id === stop.id ? { ...s, note: e.target.value } : s))}
                        rows={2}
                      />
                    </div>
                  ))}
                  {stops.length < 8 && (
                    <button
                      type="button"
                      className="cm-add-btn"
                      onClick={() => setStops([...stops, { id: Math.random().toString(36).slice(2), name: "", location: "", note: "" }])}
                    >
                      <span aria-hidden="true">＋</span> Add a stop
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── EVENT ── */}
          {activeTab === "event" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Event title</label>
                <input
                  className="cm-input"
                  placeholder="What's the event called?"
                  value={evTitle}
                  onChange={e => setEvTitle(e.target.value)}
                />
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Start date &amp; time</label>
                  <input
                    className="cm-input"
                    type="datetime-local"
                    value={evDate}
                    onChange={e => setEvDate(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">End date &amp; time <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    type="datetime-local"
                    value={evEndDate}
                    onChange={e => setEvEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Venue / location</label>
                  <input
                    className="cm-input"
                    placeholder="Venue name or address…"
                    value={evVenue}
                    onChange={e => setEvVenue(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">City</label>
                  <input
                    className="cm-input"
                    placeholder="e.g. London"
                    value={evCity}
                    onChange={e => setEvCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Description</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Tell people what to expect…"
                  value={evDesc}
                  onChange={e => setEvDesc(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Admission <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    placeholder="e.g. Free, £10, $15"
                    value={evAdmission}
                    onChange={e => setEvAdmission(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">Ticket / RSVP link <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    type="url"
                    placeholder="https://…"
                    value={evTicketUrl}
                    onChange={e => setEvTicketUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Cover banner <span className="cm-label-opt">(optional)</span></label>
                <ImageUpload url={imageUrl} onUpload={handleImageUpload} onRemove={() => setImageUrl("")} uploading={uploading} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cm-footer">
          <div className="cm-footer-left">
            <span className="cm-footer-label">Space</span>
            <select
              className="cm-category-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
              aria-label="Category"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>#{c}</option>
              ))}
            </select>
          </div>
          <div className="cm-footer-right">
            <button type="button" className="cm-cancel" onClick={handleClose}>Cancel</button>
            <button
              type="button"
              className="cm-submit"
              disabled={submitting || uploading}
              onClick={handleSubmit}
            >
              {submitting ? "Posting…" : "Publish Post"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
