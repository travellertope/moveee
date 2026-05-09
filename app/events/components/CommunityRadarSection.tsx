"use client";

import { useState, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import DiscoveredEventRow from "./DiscoveredEventRow";

interface SeededEvent {
  id: string | number;
  slug: string;
  title: string;
  eventDate?: string;
  date?: string;
  city?: string;
  location?: string;
  ticketingUrl?: string | null;
  cultureInterests?: { nodes: Array<{ name: string }> };
}

interface CommunityRadarSectionProps {
  events: SeededEvent[];
}

const INTEREST_OPTIONS = [
  { slug: "music",        label: "Music" },
  { slug: "visual-arts",  label: "Visual Arts" },
  { slug: "film",         label: "Film" },
  { slug: "literature",   label: "Literature" },
  { slug: "fashion",      label: "Fashion" },
  { slug: "food",         label: "Food & Drink" },
  { slug: "dance",        label: "Dance" },
  { slug: "theatre",      label: "Theatre" },
  { slug: "photography",  label: "Photography" },
  { slug: "design",       label: "Design" },
  { slug: "craft",        label: "Craft" },
  { slug: "performance",  label: "Performance" },
  { slug: "community",    label: "Community" },
  { slug: "heritage",     label: "Heritage" },
  { slug: "architecture", label: "Architecture" },
  { slug: "wellness",     label: "Wellness" },
  { slug: "education",    label: "Education" },
];

const EMPTY_FORM = {
  title:        "",
  event_date:   "",
  end_date:     "",
  location:     "",
  city:         "",
  admission:    "",
  ticketing_url:"",
  description:  "",
  interests:    [] as string[],
};

function getCategory(event: SeededEvent): string {
  return Array.isArray(event.cultureInterests?.nodes) && event.cultureInterests.nodes.length > 0
    ? event.cultureInterests.nodes[0].name
    : "";
}

function getDateStr(event: SeededEvent): string {
  const d = new Date(event.eventDate || event.date || Date.now());
  return isNaN(d.getTime())
    ? "TBA"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function Input({ label, name, type = "text", value, onChange, placeholder, required }: {
  label: string; name: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(20,17,13,0.6)", marginBottom: "0.35rem" }}>
        {label}{required && <span style={{ color: "var(--ochre)" }}> *</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        style={{
          width: "100%",
          padding: "0.6rem 0.75rem",
          border: "1px solid #d4cfc6",
          borderRadius: "2px",
          background: "#fff",
          color: "var(--ink)",
          fontSize: "0.875rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function Textarea({ label, name, value, onChange, placeholder }: {
  label: string; name: string; value: string;
  onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(20,17,13,0.6)", marginBottom: "0.35rem" }}>
        {label}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        style={{
          width: "100%",
          padding: "0.6rem 0.75rem",
          border: "1px solid #d4cfc6",
          borderRadius: "2px",
          background: "#fff",
          color: "var(--ink)",
          fontSize: "0.875rem",
          resize: "vertical",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default function CommunityRadarSection({ events }: CommunityRadarSectionProps) {
  const { data: session, status: authStatus } = useSession();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const field = (key: keyof typeof EMPTY_FORM) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const toggleInterest = (slug: string) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(slug)
        ? f.interests.filter((s) => s !== slug)
        : [...f.interests, slug],
    }));

  const categories = useMemo(() => {
    const cats = new Set<string>();
    events.forEach((e) => {
      const cat = getCategory(e);
      if (cat) cats.add(cat);
    });
    return ["All", ...Array.from(cats).sort()];
  }, [events]);

  const sorted = useMemo(
    () =>
      [...events].sort((a, b) => {
        const da = new Date(a.eventDate || a.date || 0).getTime();
        const db = new Date(b.eventDate || b.date || 0).getTime();
        return da - db;
      }),
    [events]
  );

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? sorted
        : sorted.filter((e) => getCategory(e) === activeCategory),
    [sorted, activeCategory]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitState("idle");
    setErrorMsg("");

    try {
      const res = await fetch("/api/events/member-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.status === 401) {
        setSubmitState("error");
        setErrorMsg("Please sign in to submit an event.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setSubmitState("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
      } else {
        setSubmitState("success");
        setForm(EMPTY_FORM);
      }
    } catch {
      setSubmitState("error");
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="disc-section">
      <div className="disc-section-inner">
        {/* Header */}
        <div className="disc-header">
          <div>
            <span className="disc-eyebrow">Community Radar</span>
            <h2 className="disc-heading">More <em>Happenings</em></h2>
            <p className="disc-subhead">
              AI-discovered events across the diaspora — sourced from the web and curated for our community.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.75rem" }}>
            <span className="disc-total">
              {filtered.length} {activeCategory !== "All" ? `in ${activeCategory}` : "discovered"}
            </span>
            <button
              onClick={() => setShowForm((v) => !v)}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "7px 16px",
                border: "1px solid var(--ochre)",
                background: showForm ? "var(--ochre)" : "transparent",
                color: showForm ? "var(--paper)" : "var(--ochre)",
                cursor: "pointer",
                borderRadius: "2px",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {showForm ? "✕ Cancel" : "+ Add Event"}
            </button>
          </div>
        </div>

        {/* Submission form */}
        {showForm && (
          <div style={{
            background: "#faf8f5",
            border: "1px solid #e0dbd1",
            borderRadius: "2px",
            padding: "2rem",
            marginBottom: "2.5rem",
          }}>
            {authStatus === "loading" ? (
              <p style={{ color: "#888", fontSize: "0.875rem" }}>Checking sign-in status…</p>
            ) : !session ? (
              /* Not signed in */
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--ink)" }}>
                  Members only
                </p>
                <p style={{ color: "#6b6157", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  Sign in to add events to the Community Radar.
                </p>
                <button
                  onClick={() => signIn()}
                  className="btn-gold"
                  style={{ padding: "0.6rem 2rem", fontSize: "0.8rem", cursor: "pointer" }}
                >
                  Sign In →
                </button>
              </div>
            ) : submitState === "success" ? (
              /* Success */
              <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>🎉</p>
                <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--ink)" }}>
                  Event added!
                </p>
                <p style={{ color: "#6b6157", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  Your event has been added to the Community Radar. Thank you for contributing.
                </p>
                <button
                  onClick={() => { setSubmitState("idle"); setShowForm(false); }}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.5rem 1.5rem",
                    border: "1px solid var(--ink)",
                    background: "transparent",
                    color: "var(--ink)",
                    cursor: "pointer",
                    borderRadius: "2px",
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit}>
                <p style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "1rem", fontWeight: 600, marginBottom: "1.5rem", color: "var(--ink)", borderBottom: "1px solid #e0dbd1", paddingBottom: "0.75rem" }}>
                  Add a Happening to the Radar
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1.5rem" }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Input label="Event Title" name="title" value={form.title} onChange={field("title")} placeholder="e.g. Afrobeats Night at Corsica Studios" required />
                  </div>
                  <Input label="Date" name="event_date" type="date" value={form.event_date} onChange={field("event_date")} required />
                  <Input label="End Date" name="end_date" type="date" value={form.end_date} onChange={field("end_date")} placeholder="For multi-day events" />
                  <Input label="Venue / Location" name="location" value={form.location} onChange={field("location")} placeholder="e.g. Barbican Centre, London" required />
                  <Input label="City" name="city" value={form.city} onChange={field("city")} placeholder="e.g. London" required />
                  <Input label="Admission" name="admission" value={form.admission} onChange={field("admission")} placeholder="Free / £10 / RSVP required" />
                  <Input label="Tickets / RSVP URL" name="ticketing_url" type="url" value={form.ticketing_url} onChange={field("ticketing_url")} placeholder="https://..." />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Textarea label="Description" name="description" value={form.description} onChange={field("description")} placeholder="What's this event about? Who's performing, showing, or speaking?" />
                  </div>
                </div>

                {/* Category chips */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(20,17,13,0.6)", marginBottom: "0.5rem" }}>
                    Category
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {INTEREST_OPTIONS.map(({ slug, label }) => {
                      const active = form.interests.includes(slug);
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => toggleInterest(slug)}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            padding: "4px 10px",
                            border: `1px solid ${active ? "var(--ink)" : "#d4cfc6"}`,
                            background: active ? "var(--ink)" : "transparent",
                            color: active ? "var(--paper)" : "rgba(20,17,13,0.55)",
                            cursor: "pointer",
                            borderRadius: "2px",
                            transition: "all 0.1s",
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {submitState === "error" && (
                  <p style={{ color: "var(--ochre)", fontSize: "0.82rem", marginBottom: "1rem", padding: "0.5rem 0.75rem", border: "1px solid var(--ochre)", borderRadius: "2px", background: "rgba(197,73,31,0.05)" }}>
                    {errorMsg}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "0.6rem 2rem",
                      border: "none",
                      background: submitting ? "#888" : "var(--ochre)",
                      color: "var(--paper)",
                      cursor: submitting ? "not-allowed" : "pointer",
                      borderRadius: "2px",
                      transition: "background 0.15s",
                    }}
                  >
                    {submitting ? "Submitting…" : "Submit Event →"}
                  </button>
                  <p style={{ fontSize: "0.75rem", color: "#888" }}>
                    Signed in as {session.user?.name || session.user?.email}
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Category filter pills */}
        {categories.length > 2 && (
          <div className="disc-filter-row">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`disc-filter-pill${activeCategory === cat ? " disc-filter-pill--active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Event list */}
        <div className="disc-list">
          {filtered.map((event) => (
            <DiscoveredEventRow
              key={event.id}
              slug={event.slug}
              title={event.title}
              date={getDateStr(event)}
              city={event.city || ""}
              location={event.location || ""}
              category={getCategory(event)}
              ticketingUrl={event.ticketingUrl}
            />
          ))}
          {filtered.length === 0 && (
            <p style={{ color: "rgba(20,17,13,0.45)", fontSize: "0.85rem", padding: "2rem 0" }}>
              No events in this category yet. Check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
