"use client";

import { useState, useEffect } from "react";

interface PortfolioItem {
  id: string;
  title: string;
  type: string;
  description: string;
  media: { type: string; url: string }[];
  external_url: string;
  tags: string[];
  created_at: string;
}

const ITEM_TYPES = [
  { value: "lookbook", label: "Lookbook" },
  { value: "writing",  label: "Writing / Article" },
  { value: "video",    label: "Video" },
  { value: "audio",    label: "Audio" },
  { value: "design",   label: "Design Work" },
  { value: "link",     label: "External Link" },
];

const TASTE_MAKER_THRESHOLD = 500;

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface Props { reputation: number; username: string }

export default function PortfolioManager({ reputation, username }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<PortfolioItem | null>(null);

  const unlocked = reputation >= TASTE_MAKER_THRESHOLD;

  useEffect(() => {
    fetch("/api/user/portfolio")
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function saveItems(newItems: PortfolioItem[]) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/user/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });
      if (!res.ok) throw new Error("Save failed.");
      setItems(newItems);
      setSuccess("Portfolio saved.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e.message ?? "Could not save.");
    }
    setSaving(false);
  }

  function handleAdd(item: PortfolioItem) {
    const updated = [...items, item];
    saveItems(updated);
    setShowForm(false);
  }

  function handleUpdate(item: PortfolioItem) {
    const updated = items.map(i => i.id === item.id ? item : i);
    saveItems(updated);
    setEditItem(null);
  }

  function handleDelete(id: string) {
    if (!confirm("Remove this portfolio item?")) return;
    saveItems(items.filter(i => i.id !== id));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const copy = [...items];
    [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
    saveItems(copy);
  }

  function moveDown(i: number) {
    if (i === items.length - 1) return;
    const copy = [...items];
    [copy[i], copy[i + 1]] = [copy[i + 1], copy[i]];
    saveItems(copy);
  }

  if (!unlocked) {
    return (
      <section className="mem-card">
        <div className="mem-card-label">Creative Portfolio</div>
        <p style={{ fontSize: "0.83rem", color: "var(--mute)", lineHeight: 1.6 }}>
          The public portfolio tab unlocks at <strong>Taste Maker</strong> status (500 reputation).
          You currently have <strong>{reputation}</strong> reputation points.
          Keep contributing to the community to unlock it.
        </p>
        <p style={{ fontSize: "0.78rem", color: "var(--mute)", marginTop: "8px" }}>
          You can still add portfolio items here — they will be published once you reach Taste Maker status.
        </p>
      </section>
    );
  }

  return (
    <section className="mem-card">
      <div className="mem-card-label">Creative Portfolio</div>

      {username && (
        <p style={{ fontSize: "0.78rem", color: "var(--mute)", marginBottom: "16px" }}>
          Public portfolio: <a href={`/connect/${username}`} style={{ color: "var(--ochre)" }}>/connect/{username}</a>
        </p>
      )}

      {success && (
        <p style={{ fontSize: "0.78rem", color: "green", marginBottom: "12px" }}>{success}</p>
      )}
      {error && (
        <p style={{ fontSize: "0.78rem", color: "#c5491f", marginBottom: "12px" }}>{error}</p>
      )}

      {loading ? (
        <p style={{ fontSize: "0.82rem", color: "var(--mute)" }}>Loading…</p>
      ) : (
        <>
          {items.length === 0 && !showForm && (
            <p style={{ fontSize: "0.83rem", color: "var(--mute)", marginBottom: "20px" }}>
              No portfolio items yet. Add your first piece of work below.
            </p>
          )}

          {items.map((item, i) => (
            <div key={item.id} style={{
              display: "flex", gap: "12px", alignItems: "center",
              padding: "12px 0", borderBottom: "1px solid rgba(42,36,28,.08)",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--ink)" }}>{item.title}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--mute)", textTransform: "uppercase", letterSpacing: ".06em" }}>{item.type}</p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button onClick={() => moveUp(i)} disabled={i === 0} className="mem-field-btn" style={{ padding: "4px 8px" }}>↑</button>
                <button onClick={() => moveDown(i)} disabled={i === items.length - 1} className="mem-field-btn" style={{ padding: "4px 8px" }}>↓</button>
                <button onClick={() => setEditItem(item)} className="mem-field-btn">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="mem-field-btn" style={{ color: "#c5491f" }}>Remove</button>
              </div>
            </div>
          ))}

          {editItem && (
            <ItemForm
              initial={editItem}
              onSave={handleUpdate}
              onCancel={() => setEditItem(null)}
              saving={saving}
            />
          )}

          {!editItem && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mem-field-btn"
              style={{ marginTop: "16px" }}
            >
              + Add portfolio item
            </button>
          )}

          {showForm && !editItem && (
            <ItemForm
              initial={null}
              onSave={handleAdd}
              onCancel={() => setShowForm(false)}
              saving={saving}
            />
          )}
        </>
      )}
    </section>
  );
}

interface ItemFormProps {
  initial: PortfolioItem | null;
  onSave: (item: PortfolioItem) => void;
  onCancel: () => void;
  saving: boolean;
}

function ItemForm({ initial, onSave, onCancel, saving }: ItemFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(initial?.type ?? "lookbook");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [externalUrl, setExternalUrl] = useState(initial?.external_url ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.media?.find(m => m.type === "image")?.url ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const item: PortfolioItem = {
      id: initial?.id ?? uuid(),
      title: title.trim(),
      type,
      description: description.trim(),
      external_url: externalUrl.trim(),
      media: imageUrl.trim() ? [{ type: "image", url: imageUrl.trim() }] : [],
      tags: [],
      created_at: initial?.created_at ?? new Date().toISOString().slice(0, 10),
    };
    onSave(item);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "20px", borderTop: "1px solid rgba(42,36,28,.1)", paddingTop: "20px" }}>
      <div className="mem-field-list">
        <div className="mem-field">
          <label className="mem-field-label">Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 120))}
            required
            placeholder="Project or piece title"
            className="mem-input"
          />
        </div>
        <div className="mem-field">
          <label className="mem-field-label">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="mem-input">
            {ITEM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="mem-field">
          <label className="mem-field-label">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 600))}
            rows={3}
            placeholder="Brief description of the work"
            className="mem-input"
          />
        </div>
        <div className="mem-field">
          <label className="mem-field-label">Cover image URL</label>
          <input
            type="url"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="mem-input"
          />
        </div>
        <div className="mem-field">
          <label className="mem-field-label">External link</label>
          <input
            type="url"
            value={externalUrl}
            onChange={e => setExternalUrl(e.target.value)}
            placeholder="https://..."
            className="mem-input"
          />
        </div>
      </div>
      <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
        <button type="submit" disabled={saving || !title.trim()} className="mem-field-btn" style={{ background: "var(--ink)", color: "var(--paper)", border: "none" }}>
          {saving ? "Saving…" : initial ? "Update" : "Add"}
        </button>
        <button type="button" onClick={onCancel} className="mem-field-btn">Cancel</button>
      </div>
    </form>
  );
}
