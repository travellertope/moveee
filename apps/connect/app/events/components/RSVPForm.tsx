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
type ErrorCode = 'already_registered' | 'sold_out' | 'generic' | null;

function formatPrice(amount?: number | null, currency?: string | null): string {
  if (!amount) return 'Free';
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'NGN' ? '₦' : '';
  return `${symbol}${amount.toLocaleString()}`;
}

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
  const [errorCode, setErrorCode] = useState<ErrorCode>(null);
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
      setErrorCode('generic');
      setStatus('error');
    } else if (cancelled) {
      setErrorMsg('Payment was cancelled.');
      setErrorCode('generic');
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

  const selectedTicket = tickets.find(t => t.ticketSlug === formData.ticket) ?? tickets[0];
  const isPaid = (selectedTicket?.ticketAmount ?? 0) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    setErrorCode(null);

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
        setErrorCode('generic');
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

      if (code === 'already_registered') {
        setErrorMsg('You are already registered for this event.');
        setErrorCode('already_registered');
      } else if (code === 'sold_out') {
        setErrorMsg('Sorry — this event is now fully booked.');
        setErrorCode('sold_out');
      } else {
        setErrorMsg(data?.message || 'Something went wrong — please try again.');
        setErrorCode('generic');
      }

      setStatus('error');
      refreshCapacity();
    } catch {
      setErrorMsg('Something went wrong — please try again.');
      setErrorCode('generic');
      setStatus('error');
    }
  };

  // ── Confirmed via Paystack callback ─────────────────────────────────────────
  if (status === 'ticket_confirmed') {
    return (
      <div className="evt-state-card evt-state-card--confirmed evt-state-card--small">
        <div className="evt-state-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3>Ticket confirmed.</h3>
        <p className="evt-state-ref">Ref: {ticketCode}</p>
      </div>
    );
  }

  // ── Stripe pending — webhook fires asynchronously ───────────────────────────
  if (status === 'ticket_pending') {
    return (
      <div className="evt-state-card evt-state-card--pending evt-state-card--small">
        <div className="evt-state-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3>Payment received.</h3>
        <p>Processing your ticket...</p>
        <p className="evt-state-ref">Ref: {ticketCode}</p>
      </div>
    );
  }

  // ── Free RSVP success ───────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="evt-state-card evt-state-card--success">
        <div className="evt-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3>You&rsquo;re on the list.</h3>
        <p>Confirmation sent by email · See you there.</p>
        <button type="button" className="evt-state-cal-link">Add to calendar</button>
      </div>
    );
  }

  const isLoading = status === 'loading';
  const showWaitlistOnly = status === 'error' && errorCode === 'sold_out';
  const showDisabledForm = status === 'error' && errorCode === 'already_registered';

  return (
    <div className={`evt-rsvp-card${isLoading ? ' evt-rsvp-loading' : ''}`}>
      <h3 className="evt-rsvp-heading">{isPaid ? 'Tickets' : 'RSVP'}</h3>

      {status === 'error' && errorMsg && (
        <div className="evt-alert-banner evt-alert-banner--error">
          <svg className="evt-alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {showWaitlistOnly ? (
        <button type="button" className="evt-waitlist-pill" disabled>Waitlist only</button>
      ) : (
        <form onSubmit={handleSubmit} className={showDisabledForm ? 'evt-rsvp-disabled' : undefined}>
          {!isPaid && capacity != null && capacity > 0 && spotsRemaining != null && (
            <div className="evt-capacity-block">
              <div className="evt-capacity-row">
                <span>Capacity</span>
                <span>{spotsRemaining} spot{spotsRemaining !== 1 ? 's' : ''} remaining</span>
              </div>
              <div className="evt-capacity-track">
                <div className="evt-capacity-fill" style={{ width: `${Math.min(100, (spotsRemaining / capacity) * 100)}%` }} />
              </div>
            </div>
          )}

          {isPaid && (
            <div
              className="evt-ticket-row"
              onClick={() => !isLoading && setFormData(f => ({ ...f, ticket: selectedTicket.ticketSlug }))}
            >
              <div>
                <div className="evt-ticket-name">{selectedTicket.ticketName}</div>
                <div className="evt-ticket-sub">{selectedTicket.ticketInfo}</div>
              </div>
              <div className="evt-ticket-price">
                {selectedTicket.ticketPrice ?? formatPrice(selectedTicket.ticketAmount, selectedTicket.ticketCurrency)}
              </div>
            </div>
          )}

          <div className="evt-field">
            <label>Full name</label>
            <input
              type="text"
              required
              disabled={isLoading}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="evt-field">
            <label>Email address</label>
            <input
              type="email"
              required
              disabled={isLoading}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {!isPaid && (
            <div className="evt-field">
              <label>How did you hear about this? <span className="evt-optional">(optional)</span></label>
              <input
                type="text"
                disabled={isLoading}
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
          )}

          {membersNote && <p className="evt-rsvp-members-note">{membersNote}</p>}

          <button
            type="submit"
            className={`evt-submit-btn${isLoading ? ' evt-submit-btn--loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="evt-submit-btn-spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Redirecting to payment…
              </>
            ) : isPaid ? (
              `Pay ${selectedTicket.ticketPrice ?? formatPrice(selectedTicket.ticketAmount, selectedTicket.ticketCurrency)} →`
            ) : (
              'Confirm RSVP →'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default RSVPForm;
