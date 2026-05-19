"use client";

import { useState, useEffect } from "react";

const DISCIPLINES = [
  "Creative", "Entrepreneur", "Artist", "Filmmaker", "Writer",
  "Designer", "Musician", "Photographer", "Tech", "Legal", "Finance", "Academic",
];

const BIO_MAX = 160;

interface DirectoryState {
  optIn: boolean;
  bio: string;
  disciplines: string[];
  instagram: string;
  linkedin: string;
  website: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function DirectoryProfile({ displayName, occupation, city, country }: {
  displayName: string;
  occupation: string;
  city: string;
  country: string;
}) {
  const [state, setState] = useState<DirectoryState>({
    optIn: true, bio: "", disciplines: [], instagram: "", linkedin: "", website: "",
  });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    fetch("/api/user/directory")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setState(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(patch: Partial<DirectoryState>) {
    const next = { ...state, ...patch };
    setState(next);
    setStatus("saving");
    try {
      const res = await fetch("/api/user/directory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directory_opt_in:       next.optIn ? "1" : "0",
          directory_bio:          next.bio,
          directory_disciplines:  next.disciplines.join(","),
          directory_instagram:    next.instagram,
          directory_linkedin:     next.linkedin,
          directory_website:      next.website,
        }),
      });
      if (!res.ok) throw new Error();
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setState(state); // revert optimistic update on failure
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  function toggleDiscipline(d: string) {
    const next = state.disciplines.includes(d)
      ? state.disciplines.filter(x => x !== d)
      : [...state.disciplines, d];
    save({ disciplines: next });
  }

  if (loading) {
    return <div className="mem-field-list"><div className="mem-field" style={{ color: "var(--mute)", fontSize: 13 }}>Loading…</div></div>;
  }

  return (
    <div className="mem-field-list">

      {/* Opt-in toggle */}
      <div className="mem-field mem-field--action">
        <div>
          <div className="mem-field-label">Show me in the directory</div>
          <div className="mem-field-value mem-field-value--muted">
            Your name, role, and location will be visible to all Moveee Connect members
          </div>
        </div>
        <button
          className={`dir-toggle${state.optIn ? " dir-toggle--on" : ""}`}
          onClick={() => save({ optIn: !state.optIn })}
          disabled={status === "saving"}
          aria-pressed={state.optIn}
          aria-label="Toggle directory listing"
        >
          <span className="dir-toggle-knob" />
        </button>
      </div>

      {state.optIn && (
        <>
          {/* Card preview */}
          <div className="mem-field">
            <div className="mem-field-label">How your card looks</div>
            <div className="dir-card-preview">
              <div className="dir-preview-avatar">
                {(displayName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="dir-preview-info">
                <div className="dir-preview-name">{displayName || "Your Name"}</div>
                {occupation && <div className="dir-preview-role">{occupation}</div>}
                {(city || country) && (
                  <div className="dir-preview-location">
                    {[city, country].filter(Boolean).join(", ")}
                  </div>
                )}
                {state.disciplines.length > 0 && (
                  <div className="dir-preview-disciplines">
                    {state.disciplines.slice(0, 3).map(d => (
                      <span key={d} className="dir-preview-tag">{d}</span>
                    ))}
                  </div>
                )}
                {state.bio && (
                  <div className="dir-preview-bio">{state.bio}</div>
                )}
              </div>
            </div>
            <p className="mem-field-value mem-field-value--muted" style={{ marginTop: 8 }}>
              Name, role, and location come from your Profile section above.
            </p>
          </div>

          {/* Bio */}
          <BioField
            value={state.bio}
            onSave={bio => save({ bio })}
            status={status}
          />

          {/* Disciplines */}
          <div className="mem-field">
            <div className="mem-field-label">Disciplines</div>
            <div className="dir-disciplines">
              {DISCIPLINES.map(d => (
                <button
                  key={d}
                  className={`dir-discipline-tag${state.disciplines.includes(d) ? " dir-discipline-tag--on" : ""}`}
                  onClick={() => toggleDiscipline(d)}
                  disabled={status === "saving"}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <LinkField label="Instagram handle" placeholder="@yourhandle" value={state.instagram} onSave={instagram => save({ instagram })} />
          <LinkField label="LinkedIn URL" placeholder="linkedin.com/in/yourname" value={state.linkedin} onSave={linkedin => save({ linkedin })} />
          <LinkField label="Website" placeholder="yoursite.com" value={state.website} onSave={website => save({ website })} />
        </>
      )}

      {/* Status feedback */}
      {status === "saved" && (
        <div className="mem-field">
          <span className="mem-fb mem-fb--ok">Changes saved ✓</span>
        </div>
      )}
      {status === "error" && (
        <div className="mem-field">
          <span className="mem-fb mem-fb--err">Could not save — please try again</span>
        </div>
      )}
    </div>
  );
}

function BioField({ value, onSave, status }: {
  value: string;
  onSave: (v: string) => void;
  status: SaveStatus;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  function commit() {
    onSave(draft.trim());
    setEditing(false);
  }

  return (
    <div className="mem-field mem-field--editable">
      <div className="mem-field-label">Bio <span style={{ fontWeight: 400, color: "var(--mute)" }}>({BIO_MAX} chars max)</span></div>
      {editing ? (
        <div className="mem-field-edit-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
          <textarea
            className="mem-field-input"
            style={{ resize: "vertical", minHeight: 80, fontFamily: "inherit", fontSize: 14, lineHeight: 1.5 }}
            value={draft}
            maxLength={BIO_MAX}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            placeholder="A sentence or two about what you do and what you're building."
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "var(--mute)", fontFamily: "var(--font-mono)" }}>
              {draft.length}/{BIO_MAX}
            </span>
            <div className="mem-field-edit-actions">
              <button className="mem-field-btn" onClick={commit} disabled={status === "saving"}>Save</button>
              <button className="mem-field-btn mem-field-btn--muted" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mem-field-view-row">
          <div className="mem-field-value">{value || <span className="mem-field-value--muted">Not set</span>}</div>
          <button className="mem-field-btn" onClick={() => setEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
}

function LinkField({ label, placeholder, value, onSave }: {
  label: string;
  placeholder: string;
  value: string;
  onSave: (v: string) => Promise<void> | void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<SaveStatus>("idle");

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  async function commit() {
    setStatus("saving");
    try {
      await onSave(draft.trim());
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
      setEditing(false);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="mem-field mem-field--editable">
      <div className="mem-field-label">{label}</div>
      {editing ? (
        <div className="mem-field-edit-row">
          <input
            className="mem-field-input"
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
          />
          <div className="mem-field-edit-actions">
            <button className="mem-field-btn" onClick={commit} disabled={status === "saving"}>Save</button>
            <button className="mem-field-btn mem-field-btn--muted" onClick={() => { setDraft(value); setEditing(false); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mem-field-view-row">
          <div className="mem-field-value">{value || <span className="mem-field-value--muted">Not set</span>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {status === "saved" && <span className="mem-fb mem-fb--ok">Saved ✓</span>}
            <button className="mem-field-btn" onClick={() => setEditing(true)}>Edit</button>
          </div>
        </div>
      )}
    </div>
  );
}
