'use client';

import { useEffect, useState } from 'react';

export interface ShowcaseItem {
  imageUrl?: string;
  title?: string;
  media?: string;
  dimensions?: string;
  year?: string;
}

export default function ShowcaseGallery({ items }: { items: ShowcaseItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="works-grid">
        {items.map((item, i) => (
          <div key={i} className="work-card">
            <div
              className="work-frame"
              role={item.imageUrl ? 'button' : undefined}
              tabIndex={item.imageUrl ? 0 : undefined}
              onClick={() => item.imageUrl && setOpenIndex(i)}
              onKeyDown={e => {
                if (item.imageUrl && (e.key === 'Enter' || e.key === ' ')) setOpenIndex(i);
              }}
            >
              {item.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title || ''} loading="lazy" />
              )}
            </div>
            <div className="work-num">N°0{i + 1}</div>
            <div className="work-title">{item.title}</div>
            <div className="work-meta">{[item.media, item.dimensions, item.year].filter(Boolean).join(' · ')}</div>
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <ShowcaseLightbox
          items={items}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}

function ShowcaseLightbox({
  items,
  index,
  onClose,
  onNavigate,
}: {
  items: ShowcaseItem[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  const item = items[index];
  const hasPrev = items.length > 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && hasPrev) onNavigate((index + 1) % items.length);
      else if (e.key === 'ArrowLeft' && hasPrev) onNavigate((index - 1 + items.length) % items.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onNavigate, index, items.length, hasPrev]);

  if (!item?.imageUrl) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: 'absolute', top: '1rem', right: '1rem',
          background: 'rgba(255,255,255,0.12)', border: 'none',
          borderRadius: '50%', width: '36px', height: '36px',
          color: '#fff', fontSize: '1rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        ✕
      </button>

      {hasPrev && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onNavigate((index - 1 + items.length) % items.length); }}
            aria-label="Previous"
            style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: '50%', width: '44px', height: '44px',
              color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ‹
          </button>
          <button
            onClick={e => { e.stopPropagation(); onNavigate((index + 1) % items.length); }}
            aria-label="Next"
            style={{
              position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: '50%', width: '44px', height: '44px',
              color: '#fff', fontSize: '1.3rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ›
          </button>
        </>
      )}

      <figure
        onClick={e => e.stopPropagation()}
        style={{ margin: 0, cursor: 'default', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.title || ''}
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: '4px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          }}
        />
        {item.title && (
          <figcaption style={{ color: '#fff', marginTop: '0.75rem', fontSize: '14px', textAlign: 'center' }}>
            {item.title}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
