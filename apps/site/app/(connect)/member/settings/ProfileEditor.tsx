"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { CountrySelect, CitySelect } from "@/components/LocationSelect";

const GENDERS = ["Prefer not to say", "Male", "Female", "Non-binary", "Other"];

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
    bio: string;
    avatarUrl?: string;
  };
}

// ── AvatarUpload ──────────────────────────────────────────────────────────────
function AvatarUpload({ initial, currentUrl }: { initial: string; currentUrl?: string }) {
  const { update } = useSession();
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/member/upload-avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPreview(data.url);
      await update({ avatarUrl: data.url });
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="sett-avatar-row">
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "var(--paper-deep, #f0ece4)",
        border: "2px solid #e0d8ce",
        overflow: "hidden", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {preview ? (
          <img src={preview} alt="Profile photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "var(--mute, #7a6f5c)" }}>{initial}</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink, #14110d)", marginBottom: 4 }}>
          Profile photo
        </div>
        {error && (
          <div style={{ color: "var(--ochre, #7a241c)", fontSize: "0.75rem", marginBottom: 4 }}>{error}</div>
        )}
        <div style={{ fontSize: "12px", color: "var(--mute, #7a6f5c)", marginBottom: 8 }}>
          JPG, PNG or WebP. Max 5 MB.
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: "none" }} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            background: "none",
            border: "1px solid rgba(20,17,13,0.2)",
            borderRadius: "var(--radius-full, 9999px)",
            padding: "7px 16px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--ink, #14110d)",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.5 : 1,
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
        >
          {uploading ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
        </button>
      </div>
    </div>
  );
}

// ── ProfileEditor ─────────────────────────────────────────────────────────────
export default function ProfileEditor({ user }: Props) {
  const { update } = useSession();
  const [form, setForm] = useState({
    display_name:        user.displayName,
    phone:               user.phone,
    whatsapp:            user.whatsapp,
    gender:              user.gender,
    date_of_birth:       user.dateOfBirth,
    nationality:         user.nationality,
    country_of_residence: user.countryOfResidence,
    city:                user.city,
    occupation:          user.occupation,
    bio:                 user.bio,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const initial = user.displayName.charAt(0).toUpperCase() || "?";

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function setCountry(value: string) {
    setForm(prev => ({ ...prev, country_of_residence: value, city: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      if (form.display_name !== user.displayName) await update({ name: form.display_name });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sett-profile-form">
      <AvatarUpload initial={initial} currentUrl={user.avatarUrl} />

      <div className="sett-form-grid">

        {/* Display name */}
        <div className="sett-form-field">
          <label className="sett-form-label">Display name</label>
          <input
            className="sett-form-input"
            type="text"
            value={form.display_name}
            onChange={e => set("display_name", e.target.value)}
          />
        </div>

        {/* Username — read only */}
        <div className="sett-form-field">
          <label className="sett-form-label">Username</label>
          <input className="sett-form-input sett-form-input--readonly" type="text" value={user.username} readOnly />
          <span className="sett-form-hint">Usernames cannot be changed</span>
        </div>

        {/* Email — read only */}
        <div className="sett-form-field">
          <label className="sett-form-label">Email address</label>
          <input className="sett-form-input sett-form-input--readonly" type="email" value={user.email} readOnly />
          <span className="sett-form-hint">Contact support to change your email</span>
        </div>

        {/* Gender */}
        <div className="sett-form-field">
          <label className="sett-form-label">Gender</label>
          <select
            className="sett-form-input sett-form-select"
            value={form.gender}
            onChange={e => set("gender", e.target.value)}
          >
            <option value="">— Select —</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Phone */}
        <div className="sett-form-field">
          <label className="sett-form-label">Phone</label>
          <input
            className="sett-form-input"
            type="text"
            value={form.phone}
            onChange={e => set("phone", e.target.value)}
            placeholder="+44 7700 000000"
          />
        </div>

        {/* WhatsApp */}
        <div className="sett-form-field">
          <label className="sett-form-label">WhatsApp</label>
          <input
            className="sett-form-input"
            type="text"
            value={form.whatsapp}
            onChange={e => set("whatsapp", e.target.value)}
            placeholder="+44 7700 000000"
          />
        </div>

        {/* Date of birth */}
        <div className="sett-form-field">
          <label className="sett-form-label">Date of birth</label>
          <input
            className="sett-form-input"
            type="date"
            value={form.date_of_birth}
            onChange={e => set("date_of_birth", e.target.value)}
          />
        </div>

        {/* Nationality */}
        <div className="sett-form-field">
          <label className="sett-form-label">Nationality</label>
          <CountrySelect
            value={form.nationality}
            onChange={v => set("nationality", v)}
            inputClassName="sett-form-input"
          />
        </div>

        {/* Country of residence */}
        <div className="sett-form-field">
          <label className="sett-form-label">Country of residence</label>
          <CountrySelect
            value={form.country_of_residence}
            onChange={setCountry}
            inputClassName="sett-form-input"
          />
        </div>

        {/* City */}
        <div className="sett-form-field">
          <label className="sett-form-label">City</label>
          <CitySelect
            country={form.country_of_residence}
            value={form.city}
            onChange={v => set("city", v)}
            inputClassName="sett-form-input"
          />
        </div>

        {/* Occupation — full width */}
        <div className="sett-form-field sett-form-field--full">
          <label className="sett-form-label">Occupation</label>
          <input
            className="sett-form-input"
            type="text"
            value={form.occupation}
            onChange={e => set("occupation", e.target.value)}
            placeholder="e.g. Writer, Designer, Engineer…"
          />
        </div>

        {/* Bio — full width */}
        <div className="sett-form-field sett-form-field--full">
          <label className="sett-form-label">Bio</label>
          <textarea
            className="sett-form-input sett-form-textarea"
            rows={3}
            value={form.bio}
            onChange={e => set("bio", e.target.value)}
            placeholder="Tell the community about yourself…"
            maxLength={500}
          />
        </div>

      </div>

      <div className="sett-save-row">
        {status === "saved" && <span className="sett-saved-msg">Changes saved ✓</span>}
        {status === "error"  && <span className="sett-error-msg">Something went wrong. Please try again.</span>}
        <button type="submit" className="sett-save-btn" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save Profile Changes"}
        </button>
      </div>
    </form>
  );
}
