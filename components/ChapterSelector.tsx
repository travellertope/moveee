'use client';

import { useState, useEffect } from 'react';

interface Chapter {
  id: number;
  name: string;
  slug: string;
}

interface Props {
  currentPrimaryId: number;
  currentPrimaryName: string;
  currentSecondaryId?: number;
  currentSecondaryName?: string;
  isPatron: boolean;
}

export default function ChapterSelector({
  currentPrimaryId,
  currentPrimaryName,
  currentSecondaryId,
  currentSecondaryName,
  isPatron,
}: Props) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [primaryId, setPrimaryId] = useState(currentPrimaryId);
  const [primaryName, setPrimaryName] = useState(currentPrimaryName || 'Not set');
  const [secondaryId, setSecondaryId] = useState(currentSecondaryId ?? 0);
  const [secondaryName, setSecondaryName] = useState(currentSecondaryName || 'Not set');

  const [editingPrimary, setEditingPrimary] = useState(false);
  const [editingSecondary, setEditingSecondary] = useState(false);

  const [draftPrimary, setDraftPrimary] = useState(currentPrimaryId);
  const [draftSecondary, setDraftSecondary] = useState(currentSecondaryId ?? 0);

  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    // Fetch available chapters and live chapter assignment in parallel
    Promise.all([
      fetch('/api/chapters').then((r) => r.json()).catch(() => []),
      fetch('/api/user/profile', { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ]).then(([chaptersData, profileData]) => {
      if (Array.isArray(chaptersData)) setChapters(chaptersData);
      if (profileData) {
        if (profileData.primaryChapter?.id) {
          setPrimaryId(profileData.primaryChapter.id);
          setDraftPrimary(profileData.primaryChapter.id);
          setPrimaryName(profileData.primaryChapter.name || 'Not set');
        }
        if (profileData.secondaryChapter?.id) {
          setSecondaryId(profileData.secondaryChapter.id);
          setDraftSecondary(profileData.secondaryChapter.id);
          setSecondaryName(profileData.secondaryChapter.name || 'Not set');
        }
      }
    });
  }, []);

  async function saveChapter(primary: number, secondary?: number) {
    setStatus('saving');
    try {
      const body: Record<string, number> = { primary_chapter: primary };
      if (secondary !== undefined) body.secondary_chapter = secondary;

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();

      const newPrimary = chapters.find((c) => c.id === primary);
      if (newPrimary) { setPrimaryId(primary); setPrimaryName(newPrimary.name); }

      if (secondary !== undefined) {
        const newSecondary = chapters.find((c) => c.id === secondary);
        setSecondaryId(secondary);
        setSecondaryName(newSecondary ? newSecondary.name : 'Not set');
      }

      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2000);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  function savePrimary() {
    setEditingPrimary(false);
    if (draftPrimary !== primaryId) saveChapter(draftPrimary, secondaryId || undefined);
  }

  function saveSecondary() {
    setEditingSecondary(false);
    if (draftSecondary !== secondaryId) saveChapter(primaryId, draftSecondary);
  }

  const availableSecondary = chapters.filter((c) => c.id !== primaryId);

  return (
    <div className="mem-field-list">
      {/* Primary chapter */}
      <div className="mem-field mem-field--editable">
        <div className="mem-field-label">Primary chapter</div>
        {editingPrimary ? (
          <div className="mem-field-edit-row">
            <select
              className="mem-field-input"
              value={draftPrimary}
              onChange={(e) => setDraftPrimary(Number(e.target.value))}
              autoFocus
            >
              <option value={0}>— Select a chapter —</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="mem-field-edit-actions">
              <button
                className="mem-field-btn"
                onClick={savePrimary}
                disabled={status === 'saving'}
              >
                {status === 'saving' ? '…' : 'Save'}
              </button>
              <button
                className="mem-field-btn mem-field-btn--muted"
                onClick={() => { setDraftPrimary(primaryId); setEditingPrimary(false); }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mem-field-view-row">
            <div className="mem-field-value">
              {primaryName !== 'Not set' ? primaryName : (
                <span className="mem-field-value--muted">Not set</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {status === 'saved' && <span className="mem-fb mem-fb--ok">Saved ✓</span>}
              {status === 'error' && <span className="mem-fb mem-fb--err">Error</span>}
              <button
                className="mem-field-btn"
                onClick={() => { setDraftPrimary(primaryId); setEditingPrimary(true); }}
              >
                {chapters.length === 0 ? 'Loading…' : 'Change'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Secondary chapter — Connect Pro only */}
      {isPatron && (
        <div className="mem-field mem-field--editable">
          <div className="mem-field-label">Secondary chapter</div>
          {editingSecondary ? (
            <div className="mem-field-edit-row">
              <select
                className="mem-field-input"
                value={draftSecondary}
                onChange={(e) => setDraftSecondary(Number(e.target.value))}
                autoFocus
              >
                <option value={0}>— None —</option>
                {availableSecondary.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="mem-field-edit-actions">
                <button
                  className="mem-field-btn"
                  onClick={saveSecondary}
                  disabled={status === 'saving'}
                >
                  {status === 'saving' ? '…' : 'Save'}
                </button>
                <button
                  className="mem-field-btn mem-field-btn--muted"
                  onClick={() => { setDraftSecondary(secondaryId); setEditingSecondary(false); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mem-field-view-row">
              <div className="mem-field-value">
                {secondaryName !== 'Not set' ? secondaryName : (
                  <span className="mem-field-value--muted">Not set</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="mem-field-btn"
                  onClick={() => { setDraftSecondary(secondaryId); setEditingSecondary(true); }}
                >
                  {chapters.length === 0 ? 'Loading…' : 'Change'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isPatron && (
        <p className="mem-settings-note">
          Connect Pro members can join a second chapter.
        </p>
      )}
    </div>
  );
}
