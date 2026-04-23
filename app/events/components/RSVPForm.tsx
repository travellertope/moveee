'use client';

import React, { useState } from 'react';

interface TicketType {
  name: string;
  info: string;
  price: string | null; // null = free
}

interface RSVPFormProps {
  eventSlug: string;
  eventTitle: string;
  capacity?: number;
  spotsRemaining?: number;
  ticketTypes?: TicketType[];
}

const DEFAULT_TICKETS: TicketType[] = [
  { name: 'Members — Private View', info: '18:00 entry · includes supper eligibility', price: null },
  { name: 'General Admission', info: '19:30 entry · open to all', price: null },
];

const RSVPForm: React.FC<RSVPFormProps> = ({
  eventSlug,
  eventTitle,
  capacity,
  spotsRemaining,
  ticketTypes = DEFAULT_TICKETS,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', ticket: 'general', source: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, eventSlug, eventTitle }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ background: 'rgba(61,74,42,0.25)', border: '1px solid rgba(61,74,42,0.4)', padding: '28px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', color: 'var(--paper)', marginBottom: '8px' }}>
          You&rsquo;re on the list.
        </p>
        <p className="rsvp-small" style={{ marginTop: 0 }}>
          Confirmation sent by email · See you there.
        </p>
      </div>
    );
  }

  const usedPercent = (capacity && spotsRemaining != null)
    ? Math.round(((capacity - spotsRemaining) / capacity) * 100)
    : null;

  return (
    <>
      {/* Capacity bar */}
      {capacity != null && spotsRemaining != null && (
        <div className="capacity-bar">
          <div className="cap-label">
            <span>Capacity</span>
            <span className="spots">{spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${usedPercent}%` }} />
          </div>
        </div>
      )}

      {/* Ticket type rows */}
      {ticketTypes.map((t, i) => (
        <div className="ticket-type" key={i}>
          <div>
            <div className="ticket-name">{t.name}</div>
            <div className="ticket-info">{t.info}</div>
          </div>
          <div className={`ticket-price${t.price === null ? ' free' : ''}`}>
            {t.price ?? 'Free'}
          </div>
        </div>
      ))}

      {/* Form */}
      <form className="rsvp-form" onSubmit={handleSubmit}>
        <div className="members-note">
          ★ Connect members: select Private View above to unlock 18:00 early entry.
        </div>

        <input
          type="text"
          placeholder="Full name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={status === 'loading'}
        />
        <input
          type="email"
          placeholder="Email address"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={status === 'loading'}
        />
        <select
          value={formData.ticket}
          onChange={(e) => setFormData({ ...formData, ticket: e.target.value })}
          disabled={status === 'loading'}
        >
          <option value="" disabled>Select ticket type</option>
          <option value="private">Moveee Connect Member — Private View (18:00)</option>
          <option value="general">General Admission — Public Opening (19:30)</option>
          <option value="supper">Origins Guest — Supper Table (pre-registered)</option>
        </select>
        <input
          type="text"
          placeholder="How did you hear about this? (optional)"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          disabled={status === 'loading'}
        />

        <button type="submit" className="rsvp-submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Processing…' : 'Confirm RSVP →'}
        </button>

        {status === 'error' && (
          <p className="rsvp-small" style={{ color: 'var(--ochre)', marginTop: '10px' }}>
            Something went wrong — please try again.
          </p>
        )}

        <p className="rsvp-small">
          Free admission · Confirmation sent by email<br />
          Doors open from 19:30 · Check your email for venue details
        </p>
      </form>
    </>
  );
};

export default RSVPForm;
