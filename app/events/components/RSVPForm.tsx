'use client';

import React, { useState, useEffect } from 'react';

interface TicketType {
  ticketName: string;
  ticketSlug: string;
  ticketInfo: string;
  ticketPrice: string | null;
  ticketAmount?: number | null;
  ticketCurrency?: string | null;
}

interface RSVPFormProps {
  eventSlug: string;
  eventTitle: string;
  capacity?: number;
  spotsRemaining?: number;
  ticketTypes?: TicketType[];
  membersNote?: string;
}

const DEFAULT_TICKETS: TicketType[] = [
  { ticketName: 'General Admission', ticketSlug: 'general', ticketInfo: 'Open to all', ticketPrice: null, ticketAmount: 0, ticketCurrency: 'NGN' },
];

type FormStatus = 'idle' | 'loading' | 'success' | 'error' | 'ticket_confirmed' | 'ticket_pending';

const RSVPForm: React.FC<RSVPFormProps> = ({
  eventSlug,
  eventTitle,
  capacity,
  spotsRemaining: initialSpotsRemaining,
  ticketTypes,
  membersNote,
}) => {
  const tickets = (ticketTypes && ticketTypes.length > 0) ? ticketTypes : DEFAULT_TICKETS;

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [spotsRemaining, setSpotsRemaining] = useState(initialSpotsRemaining);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    ticket: tickets[0]?.ticketSlug ?? 'general',
    source: '',
  });

  // Handle payment gateway return URL params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const confirmed = params.get('ticket_confirmed');
    const pending   = params.get('ticket_pending');
    const failed    = params.get('ticket_failed');
    const cancelled = params.get('ticket_cancelled');

    if (confirmed) {
      setTicketCode(confirmed);
      setStatus('ticket_confirmed');
    } else if (pending) {
      setTicketCode(pending);
      setStatus('ticket_pending');
    } else if (failed) {
      setErrorMsg('Payment unsuccessful. Please try again.');
      setStatus('error');
    } else if (cancelled) {
      setErrorMsg('Payment was cancelled.');
      setStatus('error');
    }
  }, []);

  const refreshCapacity = async () => {
    try {
      const res = await fetch(`/api/events/capacity?event_slug=${encodeURIComponent(eventSlug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.remaining != null) setSpotsRemaining(data.remaining);
      }
    } catch { /* non-critical */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const selectedTicket = tickets.find(t => t.ticketSlug === formData.ticket) ?? tickets[0];
    const isPaid = (selectedTicket?.ticketAmount ?? 0) > 0;

    try {
      if (isPaid) {
        // Paid ticket flow — redirect to payment gateway
        const res = await fetch('/api/events/ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name:           formData.name,
            email:          formData.email,
            eventSlug,
            eventTitle,
            ticketTypeSlug: selectedTicket.ticketSlug,
            ticketTypeName: selectedTicket.ticketName,
            priceAmount:    selectedTicket.ticketAmount,
            priceCurrency:  selectedTicket.ticketCurrency ?? 'NGN',
            source:         formData.source,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok && data.payment_url) {
          window.location.href = data.payment_url;
          return;
        }

        setErrorMsg(data?.message ?? 'Could not initialize payment. Please try again.');
        setStatus('error');
        return;
      }

      // Free RSVP flow
      const res = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:       formData.name,
          email:      formData.email,
          ticket:     formData.ticket,
          source:     formData.source,
          eventSlug,
          eventTitle,
        }),
      });

      if (res.ok) {
        setStatus('success');
        refreshCapacity();
        return;
      }

      const data = await res.json().catch(() => ({}));
      const code = data?.error ?? '';
      const msg =
        code === 'already_registered'
          ? 'You are already registered for this event.'
          : code === 'sold_out'
          ? 'Sorry — this event is now fully booked.'
          : data?.message || 'Something went wrong — please try again.';

      setErrorMsg(msg);
      setStatus('error');
      refreshCapacity();
    } catch {
      setErrorMsg('Something went wrong — please try again.');
      setStatus('error');
    }
  };

  // ── Confirmed via Paystack callback ─────────────────────────────────────────
  if (status === 'ticket_confirmed') {
    return (
      <div style={{ background: 'rgba(61,74,42,0.25)', border: '1px solid rgba(61,74,42,0.4)', padding: '28px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', color: 'var(--paper)', marginBottom: '8px' }}>
          Ticket confirmed.
        </p>
        <p className="rsvp-small" style={{ marginTop: 0 }}>
          Your ticket has been emailed to you. Ref: <code style={{ fontSize: '12px', letterSpacing: '0.05em' }}>{ticketCode}</code>
        </p>
      </div>
    );
  }

  // ── Stripe pending — webhook fires asynchronously ───────────────────────────
  if (status === 'ticket_pending') {
    return (
      <div style={{ background: 'rgba(30,60,90,0.2)', border: '1px solid rgba(100,160,220,0.3)', padding: '28px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', color: 'var(--paper)', marginBottom: '8px' }}>
          Payment received.
        </p>
        <p className="rsvp-small" style={{ marginTop: 0 }}>
          Your ticket confirmation will arrive by email shortly. Ref: <code style={{ fontSize: '12px', letterSpacing: '0.05em' }}>{ticketCode}</code>
        </p>
      </div>
    );
  }

  // ── Free RSVP success ───────────────────────────────────────────────────────
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

  const usedPercent =
    capacity != null && spotsRemaining != null && capacity > 0
      ? Math.round(((capacity - spotsRemaining) / capacity) * 100)
      : null;

  const selectedTicket = tickets.find(t => t.ticketSlug === formData.ticket) ?? tickets[0];
  const isPaid = (selectedTicket?.ticketAmount ?? 0) > 0;

  return (
    <>
      {/* Capacity bar */}
      {capacity != null && capacity > 0 && spotsRemaining != null && (
        <div className="capacity-bar">
          <div className="cap-label">
            <span>Capacity</span>
            <span className="spots">{spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${usedPercent ?? 0}%` }} />
          </div>
        </div>
      )}

      {/* Ticket type rows */}
      {tickets.map((t, i) => (
        <div className="ticket-type" key={i}>
          <div>
            <div className="ticket-name">{t.ticketName}</div>
            <div className="ticket-info">{t.ticketInfo}</div>
          </div>
          <div className={`ticket-price${(!t.ticketAmount || t.ticketAmount === 0) ? ' free' : ''}`}>
            {t.ticketPrice ?? ((!t.ticketAmount || t.ticketAmount === 0) ? 'Free' : null)}
          </div>
        </div>
      ))}

      {/* Form */}
      <form className="rsvp-form" onSubmit={handleSubmit}>
        {membersNote && (
          <div className="members-note">{membersNote}</div>
        )}

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

        {tickets.length > 1 && (
          <select
            value={formData.ticket}
            onChange={(e) => setFormData({ ...formData, ticket: e.target.value })}
            disabled={status === 'loading'}
          >
            {tickets.map((t) => (
              <option key={t.ticketSlug} value={t.ticketSlug}>
                {t.ticketName}{t.ticketInfo ? ` — ${t.ticketInfo}` : ''}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          placeholder="How did you hear about this? (optional)"
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          disabled={status === 'loading'}
        />

        <button type="submit" className="rsvp-submit" disabled={status === 'loading'}>
          {status === 'loading'
            ? (isPaid ? 'Redirecting to payment…' : 'Processing…')
            : (isPaid ? `Pay ${selectedTicket?.ticketPrice ?? ''} →` : 'Confirm RSVP →')}
        </button>

        {status === 'error' && (
          <p className="rsvp-small" style={{ color: 'var(--ochre)', marginTop: '10px' }}>
            {errorMsg}
          </p>
        )}

        <p className="rsvp-small">
          {isPaid
            ? 'You will be redirected to a secure payment page · Confirmation sent by email'
            : 'Confirmation sent by email · Please bring this email or your name at the door'}
        </p>
      </form>
    </>
  );
};

export default RSVPForm;
