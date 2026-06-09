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

const TYPE_EMOJI: Record<string, string> = {
  lookbook: "🖼️", writing: "✍️", video: "🎬",
  audio: "🎵", design: "🎨", link: "🔗",
};
const TYPE_LABEL: Record<string, string> = {
  lookbook: "Lookbook", writing: "Writing", video: "Video",
  audio: "Audio", design: "Design", link: "Link",
};

interface Props {
  username: string;
  unlocked: boolean;
  reputationTier: string;
}

export default function PortfolioTab({ username, unlocked, reputationTier }: Props) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    if (!unlocked) { setLoading(false); return; }
    fetch(`/api/connect/${username}/portfolio`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(d => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [username, unlocked]);

  if (!unlocked) {
    return (
      <div className="prf-portfolio-gate">
        <p className="prf-portfolio-gate-title">Portfolio coming soon</p>
        <p className="prf-portfolio-gate-desc">
          The portfolio tab unlocks at Taste Maker status (500 reputation).
          This member is currently at <strong>{reputationTier}</strong> tier.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="prf-loading">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="prf-skeleton" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="prf-empty">No portfolio items yet.</p>;
  }

  return (
    <>
      <div className="prf-portfolio-grid">
        {items.map(item => (
          <PortfolioCard key={item.id} item={item} onClick={() => setSelected(item)} />
        ))}
      </div>

      {selected && (
        <div className="prf-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="prf-modal" onClick={e => e.stopPropagation()}>
            <button className="prf-modal-close" onClick={() => setSelected(null)}>✕</button>
            {selected.media?.[0]?.url && (
              selected.media[0].type === "image"
                ? <img src={selected.media[0].url} alt={selected.title} className="prf-modal-img" />
                : null
            )}
            <div className="prf-modal-body">
              <p className="prf-modal-type">{TYPE_LABEL[selected.type] ?? selected.type}</p>
              <h2 className="prf-modal-title">{selected.title}</h2>
              {selected.description && <p className="prf-modal-desc">{selected.description}</p>}
              {selected.external_url && (
                <a
                  href={selected.external_url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="prf-modal-link"
                >
                  View project →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PortfolioCard({ item, onClick }: { item: PortfolioItem; onClick: () => void }) {
  const thumb = item.media?.find(m => m.type === "image")?.url;

  return (
    <div className="prf-portfolio-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}>
      {thumb ? (
        <img src={thumb} alt={item.title} className="prf-portfolio-thumb" />
      ) : (
        <div className="prf-portfolio-thumb-placeholder">
          {TYPE_EMOJI[item.type] ?? "📁"}
        </div>
      )}
      <div className="prf-portfolio-card-body">
        <p className="prf-portfolio-card-type">{TYPE_LABEL[item.type] ?? item.type}</p>
        <h3 className="prf-portfolio-card-title">{item.title}</h3>
        {item.description && <p className="prf-portfolio-card-desc">{item.description}</p>}
      </div>
    </div>
  );
}
