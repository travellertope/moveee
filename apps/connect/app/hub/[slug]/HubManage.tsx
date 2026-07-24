"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

interface HubMember {
  id: number;
  name: string;
  avatarUrl: string;
  role: string;
  joinedAt: string;
}

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

export default function HubManage({
  hubId, initialName, initialDescription, initialAllowedTemplates, initialCoverImageUrl, isArchived, role,
}: {
  hubId: number;
  initialName: string;
  initialDescription: string;
  initialAllowedTemplates: string[];
  initialCoverImageUrl: string;
  isArchived: boolean;
  /** Owners get full edit/appoint-mod/archive tools; mods get a lighter
   * "Moderate" panel — members list + remove-member only (docs/hubs-plan.md
   * §4.4/§7.1). */
  role: "owner" | "mod";
}) {
  const isOwner = role === "owner";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [allowed, setAllowed] = useState<string[]>(initialAllowedTemplates);
  const [coverImageUrl, setCoverImageUrl] = useState(initialCoverImageUrl);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [members, setMembers] = useState<HubMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberBusyId, setMemberBusyId] = useState<number | null>(null);
  const [memberError, setMemberError] = useState("");

  useEffect(() => {
    if (!open) return;
    setMembersLoading(true);
    fetch(`/api/hub/${hubId}/members?per_page=100`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setMembers(data?.members ?? []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [open, hubId]);

  const appointMod = async (userId: number) => {
    setMemberBusyId(userId);
    setMemberError("");
    try {
      const res = await fetch(`/api/hub/${hubId}/mods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_user_id: userId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMemberError(data?.message || "Could not appoint mod.");
      } else {
        setMembers((cur) => cur.map((m) => (m.id === userId ? { ...m, role: "mod" } : m)));
      }
    } catch {
      setMemberError("Could not appoint mod.");
    }
    setMemberBusyId(null);
  };

  const removeMod = async (userId: number) => {
    setMemberBusyId(userId);
    setMemberError("");
    try {
      const res = await fetch(`/api/hub/${hubId}/mods/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMemberError(data?.message || "Could not remove mod.");
      } else {
        setMembers((cur) => cur.map((m) => (m.id === userId ? { ...m, role: "member" } : m)));
      }
    } catch {
      setMemberError("Could not remove mod.");
    }
    setMemberBusyId(null);
  };

  const removeMember = async (userId: number) => {
    if (!confirm("Remove this member from the Hub?")) return;
    setMemberBusyId(userId);
    setMemberError("");
    try {
      const res = await fetch(`/api/hub/${hubId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMemberError(data?.message || "Could not remove member.");
      } else {
        setMembers((cur) => cur.filter((m) => m.id !== userId));
      }
    } catch {
      setMemberError("Could not remove member.");
    }
    setMemberBusyId(null);
  };

  const toggle = (slug: string) => {
    setAllowed((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
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

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/hub/${hubId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          allowed_templates: allowed,
          cover_image_url: coverImageUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not save changes.");
        setSaving(false);
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Could not save changes.");
    }
    setSaving(false);
  };

  const archive = async () => {
    if (!confirm("Archive this Hub? It becomes read-only — no new posts, joins, or edits. This can't be undone.")) return;
    setArchiving(true);
    setError("");
    try {
      const res = await fetch(`/api/hub/${hubId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not archive this Hub.");
        setArchiving(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not archive this Hub.");
      setArchiving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mem-settings-back-link"
        style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
      >
        {isOwner ? "Manage Hub →" : "Moderate →"}
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="mem-card-label">{isOwner ? "Manage Hub" : "Moderate"}</div>
      {error && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: 0 }}>{error}</p>}
      {isOwner && (
      <>

      <label className="hfc-label" htmlFor="hub-manage-name">Hub name</label>
      <input
        id="hub-manage-name"
        type="text"
        className="hfc-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving || isArchived}
      />

      <label className="hfc-label" htmlFor="hub-manage-desc">Description</label>
      <textarea
        id="hub-manage-desc"
        className="hfc-textarea"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={saving || isArchived}
      />

      <label className="hfc-label" htmlFor="hub-manage-cover">Cover image</label>
      <input
        id="hub-manage-cover"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleCoverPick}
        disabled={saving || uploadingCover || isArchived}
      />
      {uploadingCover && <p className="hfc-capacity-hint">Uploading…</p>}
      {coverImageUrl && !uploadingCover && (
        <img
          src={coverImageUrl}
          alt=""
          style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: "var(--radius-lg, 6px)" }}
        />
      )}

      <p className="hfc-label" style={{ marginTop: 8 }}>What can members post?</p>
      <div className="hfc-venue-grid">
        {ALL_TEMPLATES.map((t) => (
          <button
            key={t.slug}
            type="button"
            className={`hfc-venue-chip${allowed.includes(t.slug) ? " hfc-venue-chip--active" : ""}`}
            onClick={() => toggle(t.slug)}
            disabled={isArchived}
            title={t.gated ? `Members will still need ${t.gated} to use this template.` : undefined}
          >
            <span className="hfc-venue-icon">{t.emoji}</span>
            <span className="hfc-venue-label">{t.label}{t.gated ? " 🔒" : ""}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <button
          type="button"
          className="con-btn-primary"
          onClick={save}
          disabled={saving || isArchived || !name.trim() || !description.trim()}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mem-settings-back-link"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Close
        </button>
      </div>
      </>
      )}

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
        <p className="hfc-label" style={{ marginBottom: 8 }}>Members</p>
        {memberError && <p style={{ fontSize: "0.78rem", color: "#c0392b", margin: "0 0 8px" }}>{memberError}</p>}
        {membersLoading ? (
          <p className="mem-card-desc" style={{ margin: 0 }}>Loading…</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
              >
                <span style={{ fontSize: 13 }}>
                  {m.name}{" "}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--mute)", textTransform: "uppercase" }}>
                    {m.role}
                  </span>
                </span>
                {m.role !== "owner" && (!(m.role === "mod") || isOwner) && (
                  <div style={{ display: "flex", gap: 8 }}>
                    {isOwner && m.role === "mod" ? (
                      <button
                        type="button"
                        onClick={() => removeMod(m.id)}
                        disabled={memberBusyId === m.id || isArchived}
                        className="mem-settings-back-link"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12 }}
                      >
                        Remove mod
                      </button>
                    ) : isOwner ? (
                      <button
                        type="button"
                        onClick={() => appointMod(m.id)}
                        disabled={memberBusyId === m.id || isArchived}
                        className="mem-settings-back-link"
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12 }}
                      >
                        Make mod
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeMember(m.id)}
                      disabled={memberBusyId === m.id || isArchived}
                      className="mem-settings-back-link"
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, color: "#c0392b" }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isOwner && !isArchived && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
          <button
            type="button"
            onClick={archive}
            disabled={archiving}
            className="mem-settings-back-link"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#c0392b" }}
          >
            {archiving ? "Archiving…" : "Archive this Hub"}
          </button>
        </div>
      )}
    </div>
  );
}
