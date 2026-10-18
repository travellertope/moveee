"use client";

import { useState, useEffect, useRef } from "react";

interface ChatterMessage {
  id: number;
  authorName: string;
  authorAvatar?: string;
  authorInitial: string;
  avatarColor: string;
  text: string;
  images?: string[];
  createdAt: string;
}

const AVATAR_COLORS = [
  "#7a241c","#1976d2","#2e7d32","#b38238","#6b48a8","#8d6e63",
  "#7b1fa2","#c2185b","#00695c","#37474f","#283593","#5d4037",
];
function avatarColor(id: number | string): string {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function mapMessage(m: any): ChatterMessage {
  return {
    id: m.id,
    authorName: m.author_name ?? m.authorName ?? "Member",
    authorAvatar: m.author_avatar ?? m.authorAvatar,
    authorInitial: (m.author_name ?? m.authorName ?? "M").charAt(0).toUpperCase(),
    avatarColor: avatarColor(m.author_id ?? m.authorId ?? m.id),
    text: m.text ?? m.message ?? "",
    images: m.images ?? [],
    createdAt: m.created_at ?? m.createdAt ?? new Date().toISOString(),
  };
}

interface Props {
  clusterId: number;
  isMember: boolean;
}

const POLL_INTERVAL_MS = 15_000;

export default function StoopChatterBox({ clusterId, isMember }: Props) {
  const [messages, setMessages] = useState<ChatterMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [liveIndicator, setLiveIndicator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/cluster/${clusterId}/chatter`, { cache: "no-store" })
      .then(res => res.ok ? res.json() : { messages: [] })
      .then(data => {
        if (cancelled) return;
        const mapped = (data.messages ?? []).map(mapMessage);
        setMessages(mapped);
        if (mapped.length > 0) lastIdRef.current = mapped[mapped.length - 1].id;
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [clusterId]);

  // Live polling for new messages
  useEffect(() => {
    if (!isMember) return;
    pollRef.current = setInterval(async () => {
      try {
        const since = lastIdRef.current;
        const res = await fetch(`/api/cluster/${clusterId}/chatter?since=${since}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const newMsgs: ChatterMessage[] = (data.messages ?? []).map(mapMessage)
          .filter((m: ChatterMessage) => m.id > since);
        if (newMsgs.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const fresh = newMsgs.filter(m => !existingIds.has(m.id));
            if (fresh.length === 0) return prev;
            lastIdRef.current = fresh[fresh.length - 1].id;
            setLiveIndicator(true);
            setTimeout(() => setLiveIndicator(false), 2000);
            return [...prev, ...fresh];
          });
        }
      } catch {}
    }, POLL_INTERVAL_MS);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [clusterId, isMember]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 2 - images.length;
    const added = files.slice(0, remaining);
    if (added.length === 0) return;
    setImages(prev => [...prev, ...added]);
    added.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/community/upload-image", { method: "POST", body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url ?? null;
    } catch { return null; }
  }

  async function handlePost() {
    const trimmed = text.trim();
    if (!trimmed || posting) return;
    setPosting(true); setError("");
    let uploadedUrls: string[] = [];
    if (images.length > 0) {
      const results = await Promise.all(images.map(uploadImage));
      uploadedUrls = results.filter((u): u is string => u !== null);
    }
    try {
      const res = await fetch(`/api/cluster/${clusterId}/chatter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, images: uploadedUrls }),
      });
      if (res.ok) {
        const data = await res.json();
        const newMsg = mapMessage({
          id: data.message?.id ?? Date.now(),
          author_name: data.message?.author_name ?? "You",
          author_id: data.message?.author_id ?? "me",
          text: trimmed,
          images: uploadedUrls,
          created_at: data.message?.created_at ?? new Date().toISOString(),
        });
        setMessages(prev => [...prev, newMsg]);
        lastIdRef.current = newMsg.id;
        setText(""); setImages([]); setImagePreviews([]);
      } else {
        const d = await res.json().catch(() => ({}));
        setError(d?.message || "Could not post. Try again.");
      }
    } catch { setError("Could not post. Try again."); }
    finally { setPosting(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); }
  }

  return (
    <div className="stoop-chatter-root">
      <div className="stoop-chatter-header-row">
        <h3 className="stoop-dp-section-heading" style={{ margin: 0 }}>Stoop Chat</h3>
        {isMember && (
          <span className={`stoop-chatter-live-dot${liveIndicator ? " stoop-chatter-live-dot--pulse" : ""}`}
            title="Live — updates every 15s" aria-label="Live chat">
            <span className="stoop-chatter-live-dot-inner" />
            Live
          </span>
        )}
      </div>

      {loading ? (
        <p className="stoop-chatter-loading">Loading chat…</p>
      ) : messages.length === 0 ? (
        <p className="stoop-chatter-empty">
          {isMember ? "No messages yet — kick off the conversation!" : "Join this Stoop to see and send messages."}
        </p>
      ) : (
        <div className="stoop-chatter-list">
          {messages.map(msg => (
            <div key={msg.id} className="stoop-chatter-msg">
              <span className="stoop-chatter-avatar" style={{ background: msg.avatarColor }} aria-hidden="true">
                {msg.authorInitial}
              </span>
              <div className="stoop-chatter-body">
                <div className="stoop-chatter-meta">
                  <span className="stoop-chatter-name">{msg.authorName}</span>
                  <span className="stoop-chatter-time">{timeAgo(msg.createdAt)}</span>
                </div>
                <p className="stoop-chatter-text">{msg.text}</p>
                {msg.images && msg.images.length > 0 && (
                  <div className="stoop-chatter-images">
                    {msg.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="stoop-chatter-img" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {isMember && (
        <div className="stoop-chatter-composer">
          {imagePreviews.length > 0 && (
            <div className="stoop-chatter-preview-row">
              {imagePreviews.map((src, i) => (
                <div key={i} className="stoop-chatter-preview-item">
                  <img src={src} alt="" className="stoop-chatter-preview-img" />
                  <button type="button" className="stoop-chatter-preview-remove"
                    onClick={() => removeImage(i)} aria-label="Remove image">×</button>
                </div>
              ))}
            </div>
          )}
          <div className="stoop-chatter-input-row">
            <textarea className="stoop-chatter-input" placeholder="Message your Stoop…"
              value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
              rows={1} maxLength={500} />
            {images.length < 2 && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" multiple
                  style={{ display: "none" }} onChange={handleImagePick} />
                <button type="button" className="stoop-chatter-img-btn"
                  onClick={() => fileInputRef.current?.click()} aria-label="Attach image" title="Attach image (max 2)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>
              </>
            )}
            <button type="button"
              className={`stoop-chatter-post-btn${!text.trim() || posting ? " stoop-chatter-post-btn--disabled" : ""}`}
              onClick={handlePost} disabled={!text.trim() || posting}>
              {posting ? "…" : "Send"}
            </button>
          </div>
          {error && <p className="stoop-chatter-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
