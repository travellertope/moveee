"use client";

/**
 * Shared searchable location selects.
 * Used on /register (inline styles) and /member/settings (CSS classes).
 */

import { useState, useRef, useEffect } from "react";

export const COUNTRIES = [
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

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** Pass a CSS class name (e.g. "mem-field-input") OR inline style object */
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
  id?: string;
}

// ── Internal combobox ─────────────────────────────────────────────────────────
function Combobox({
  options,
  value,
  onChange,
  placeholder,
  inputClassName,
  inputStyle,
  id,
}: SelectProps & { options: string[] }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())).slice(0, 60)
    : options.slice(0, 60);

  useEffect(() => {
    const el = listRef.current?.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

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
    if (!open) { if (e.key !== "Tab") setOpen(true); return; }
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
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        id={id}
        type="text"
        className={inputClassName}
        style={inputStyle}
        value={query}
        placeholder={placeholder ?? "Type to search…"}
        autoComplete="off"
        onChange={e => {
          setQuery(e.target.value);
          onChange(e.target.value); // keep parent in sync as user types
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
            zIndex: 9999,
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
                background: i === highlighted ? "#f0f0f0" : "transparent",
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

// ── Public: Country select ────────────────────────────────────────────────────
export function CountrySelect(props: SelectProps) {
  return <Combobox {...props} options={COUNTRIES} placeholder={props.placeholder ?? "Search countries…"} />;
}

// ── Public: City select ───────────────────────────────────────────────────────
export function CitySelect({
  country,
  ...props
}: SelectProps & { country: string }) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!country) { setCities([]); return; }
    setLoading(true);
    setCities([]);
    fetch(`/api/cities?country=${encodeURIComponent(country)}`)
      .then(r => r.json())
      .then(d => setCities(d.cities ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [country]);

  const placeholder = loading
    ? "Loading cities…"
    : country
    ? "Search cities…"
    : "Select a country first";

  if (cities.length > 0) {
    return <Combobox {...props} options={cities} placeholder="Search cities…" />;
  }

  // Plain text while loading or no cities available
  return (
    <input
      id={props.id}
      type="text"
      className={props.inputClassName}
      style={props.inputStyle}
      value={props.value}
      placeholder={placeholder}
      disabled={loading}
      onChange={e => props.onChange(e.target.value)}
    />
  );
}
