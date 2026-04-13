"use client";

import { useState, useRef, useEffect } from "react";

// ── Country list (ISO 3166-1) ─────────────────────────────────────────────────
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda",
  "Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain",
  "Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso",
  "Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic",
  "Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Croatia",
  "Cuba","Cyprus","Czechia","Democratic Republic of the Congo","Denmark","Djibouti",
  "Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea",
  "Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan",
  "Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho",
  "Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius",
  "Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco",
  "Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand",
  "Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru",
  "Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa",
  "San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles",
  "Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname",
  "Sweden","Switzerland","Syria","Tajikistan","Tanzania","Thailand","Timor-Leste",
  "Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan","Tuvalu",
  "Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

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

// ── Searchable Combobox ───────────────────────────────────────────────────────
function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = "Type to search…",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(true);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 60)
    : options.slice(0, 60);

  // Scroll highlighted item into view
  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // Close on click outside
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function select(opt: string) {
    onChange(opt);
    setQuery(opt);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) { setOpen(true); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        type="text"
        className="mem-field-input"
        value={query}
        placeholder={placeholder}
        autoFocus
        autoComplete="off"
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlighted(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #d4cbbf",
            borderRadius: 3,
            maxHeight: 200,
            overflowY: "auto",
            zIndex: 200,
            listStyle: "none",
            margin: 0,
            padding: 0,
            boxShadow: "0 4px 12px rgba(20,17,13,.08)",
          }}
        >
          {filtered.map((opt, i) => (
            <li
              key={opt}
              onMouseDown={() => select(opt)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 14,
                color: "#14110d",
                background: i === highlighted ? "#f5f0e8" : "transparent",
                borderBottom: i < filtered.length - 1 ? "1px solid #f0ebe3" : "none",
              }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── City Combobox (fetches dynamically by country) ────────────────────────────
function CityCombobox({
  country,
  value,
  onChange,
}: {
  country: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) return;
    setLoading(true);
    setCities([]);
    fetch(`/api/cities?country=${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then(d => { setCities(d.cities ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [country]);

  if (loading) {
    return (
      <input
        type="text"
        className="mem-field-input"
        value={value}
        disabled
        placeholder="Loading cities…"
        onChange={() => {}}
      />
    );
  }

  if (cities.length === 0) {
    // No country set or API unavailable — plain text input
    return (
      <input
        type="text"
        className="mem-field-input"
        value={value}
        autoFocus
        placeholder={country ? "Enter your city" : "Set country first, then city"}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Escape") (e.target as HTMLInputElement).blur();
        }}
      />
    );
  }

  return (
    <SearchableCombobox
      options={cities}
      value={value}
      onChange={onChange}
      placeholder="Search cities…"
    />
  );
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
            <SearchableCombobox
              options={COUNTRIES}
              value={draft}
              onChange={setDraft}
              placeholder="Search countries…"
            />
          ) : field.type === "city" ? (
            <CityCombobox
              country={countryContext ?? ""}
              value={draft}
              onChange={setDraft}
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
