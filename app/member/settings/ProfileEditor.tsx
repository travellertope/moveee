"use client";

import { useState } from "react";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";

const GENDERS = ["Prefer not to say", "Male", "Female", "Non-binary", "Other"];

// ── Types ─────────────────────────────────────────────────────────────────────
interface Field {
  key: string;
  label: string;
  value: string;
  type?: "text" | "email" | "date" | "select" | "country" | "city";
  options?: string[];
  readOnly?: boolean;
  readOnlyNote?: string;
}

interface Props {
  user: {
    displayName: string;
    email: string;
    username: string;
    phone: string;
    whatsapp: string;
    gender: string;
    dateOfBirth: string;
    nationality: string;
    countryOfResidence: string;
    city: string;
    occupation: string;
  };
}

// ── ProfileEditor ─────────────────────────────────────────────────────────────
export default function ProfileEditor({ user }: Props) {
  // Track country of residence so city combobox always has the latest value
  const [currentCountry, setCurrentCountry] = useState(user.countryOfResidence);

  const fields: Array<Field & { onSaved?: (v: string) => void; countryContext?: string }> = [
    { key: "display_name",         label: "Display name",         value: user.displayName,        type: "text" },
    { key: "email",                label: "Email address",        value: user.email,              readOnly: true, readOnlyNote: "Contact support to change your email" },
    { key: "username",             label: "Username",             value: user.username,           readOnly: true, readOnlyNote: "Usernames cannot be changed" },
    { key: "phone",                label: "Phone",                value: user.phone,              type: "text" },
    { key: "whatsapp",             label: "WhatsApp",             value: user.whatsapp,           type: "text" },
    { key: "gender",               label: "Gender",               value: user.gender,             type: "select", options: GENDERS },
    { key: "date_of_birth",        label: "Date of birth",        value: user.dateOfBirth,        type: "date" },
    { key: "nationality",          label: "Nationality",          value: user.nationality,        type: "country" },
    {
      key: "country_of_residence",
      label: "Country of residence",
      value: user.countryOfResidence,
      type: "country",
      onSaved: (v) => setCurrentCountry(v),
    },
    { key: "city", label: "City", value: user.city, type: "city", countryContext: currentCountry },
    { key: "occupation",           label: "Occupation",           value: user.occupation,         type: "text" },
  ];

  return (
    <div className="mem-field-list">
      {fields.map((f) => (
        <EditableField
          key={f.key}
          field={f}
          onSaved={f.onSaved}
          countryContext={f.countryContext}
        />
      ))}
    </div>
  );
}

// ── EditableField ─────────────────────────────────────────────────────────────
function EditableField({
  field,
  onSaved,
  countryContext,
}: {
  field: Field;
  onSaved?: (v: string) => void;
  countryContext?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(field.value);
  const [current, setCurrent] = useState(field.value);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    if (draft === current) { setEditing(false); return; }
    setStatus("saving");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field.key]: draft }),
      });
      if (!res.ok) throw new Error();
      setCurrent(draft);
      onSaved?.(draft);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
      setEditing(false);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  function cancel() {
    setDraft(current);
    setEditing(false);
    setStatus("idle");
  }

  if (field.readOnly) {
    return (
      <div className="mem-field">
        <div className="mem-field-label">{field.label}</div>
        <div className="mem-field-value">{current || "—"}</div>
        {field.readOnlyNote && (
          <div className="mem-field-value mem-field-value--muted">{field.readOnlyNote}</div>
        )}
      </div>
    );
  }

  return (
    <div className="mem-field mem-field--editable">
      <div className="mem-field-label">{field.label}</div>

      {editing ? (
        <div className="mem-field-edit-row">
          {field.type === "select" ? (
            <select
              className="mem-field-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
            >
              <option value="">— Select —</option>
              {field.options!.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : field.type === "country" ? (
            <CountrySelect
              value={draft}
              onChange={setDraft}
              inputClassName="mem-field-input"
              autoFocus
            />
          ) : field.type === "city" ? (
            <CitySelect
              country={countryContext ?? ""}
              value={draft}
              onChange={setDraft}
              inputClassName="mem-field-input"
              autoFocus
            />
          ) : (
            <input
              className="mem-field-input"
              type={field.type ?? "text"}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            />
          )}
          <div className="mem-field-edit-actions">
            <button
              className="mem-field-btn"
              onClick={save}
              disabled={status === "saving"}
            >
              {status === "saving" ? "…" : "Save"}
            </button>
            <button className="mem-field-btn mem-field-btn--muted" onClick={cancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mem-field-view-row">
          <div className="mem-field-value">
            {current || <span className="mem-field-value--muted">Not set</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {status === "saved" && <span className="mem-fb mem-fb--ok">Saved ✓</span>}
            {status === "error"  && <span className="mem-fb mem-fb--err">Error</span>}
            <button
              className="mem-field-btn"
              onClick={() => { setEditing(true); setStatus("idle"); }}
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
