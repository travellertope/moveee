"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";

const OCCUPATIONS = [
  "Student", "Writer", "Editor", "Educator", "Artist", "Designer", "Marketer",
  "Engineer", "Healthcare", "Finance", "Founder / Entrepreneur", "Other",
];

/**
 * The one-time form on app/literary/lit-welcome/page.tsx — PATCHes
 * /api/user/profile directly (the account already exists and is already
 * paid for by the time this renders, see LiteraryLitCheckout.tsx). Never
 * blocking: every field here is optional, and skipping just goes straight
 * to /literary.
 */
export default function LitWelcomeForm() {
  const router = useRouter();
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_of_birth: dob,
          country_of_residence: country,
          city,
          occupation,
        }),
      });
      router.push("/literary");
    } catch {
      setError("Couldn't save that — you can always fill this in later from Account Settings.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="lit-form" onSubmit={handleSubmit}>
      <div className="lit-form-field">
        <label htmlFor="lit-welcome-dob">Date of birth</label>
        <input
          id="lit-welcome-dob"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />
      </div>
      <div className="lit-form-field">
        <label htmlFor="lit-welcome-country">Country</label>
        <CountrySelect id="lit-welcome-country" value={country} onChange={setCountry} />
      </div>
      <div className="lit-form-field">
        <label htmlFor="lit-welcome-city">City</label>
        <CitySelect id="lit-welcome-city" country={country} value={city} onChange={setCity} />
      </div>
      <div className="lit-form-field">
        <label htmlFor="lit-welcome-occupation">Occupation</label>
        <select
          id="lit-welcome-occupation"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
        >
          <option value="">— Select —</option>
          {OCCUPATIONS.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      {error && <p className="lit-form-error">{error}</p>}
      <button type="submit" className="lit-form-submit" disabled={busy}>
        {busy ? "Saving…" : "Save and continue →"}
      </button>
      <p className="lit-form-hint">
        <button type="button" className="lit-form-linklike" onClick={() => router.push("/literary")}>
          Skip for now
        </button>
      </p>
    </form>
  );
}
