"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface OrderDetail {
  id: number; number: string; status: string; dateCreated: string;
  dateModified: string; total: string; shippingTotal: string;
  customer: { id: number; firstName: string; lastName: string; email: string; phone: string; };
  billing:  { address1: string; address2: string; city: string; state: string; postcode: string; country: string; };
  shipping: { name: string; address1: string; address2: string; city: string; state: string; postcode: string; country: string; };
  items: { id: number; name: string; quantity: number; total: string; unitPrice: string; sku: string; image: string | null; productId: number; }[];
  paymentMethod: string; customerNote: string;
  notes: { id: number; note: string; dateCreated: string; customerNote: boolean; }[];
  metaData: { key: string; value: string; }[];
}

const STATUS_FLOW: Record<string, { label: string; next: { value: string; label: string; }[] }> = {
  pending:    { label: "Pending",    next: [{ value: "processing", label: "Mark as processing" }, { value: "cancelled", label: "Cancel order" }] },
  processing: { label: "Processing", next: [{ value: "completed",  label: "Mark as completed"  }, { value: "on-hold",   label: "Put on hold"  }] },
  "on-hold":  { label: "On hold",    next: [{ value: "processing", label: "Resume processing"   }, { value: "cancelled", label: "Cancel order" }] },
  completed:  { label: "Completed",  next: [] },
  cancelled:  { label: "Cancelled",  next: [{ value: "processing", label: "Reopen order" }] },
  refunded:   { label: "Refunded",   next: [] },
};

const STATUS_STYLE: Record<string, string> = {
  pending:    "vdo-status--pending",
  processing: "vdo-status--processing",
  "on-hold":  "vdo-status--hold",
  completed:  "vdo-status--completed",
  cancelled:  "vdo-status--cancelled",
  refunded:   "vdo-status--refunded",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function AddressBlock({ label, addr }: { label: string; addr: any }) {
  const lines = [addr.address1, addr.address2, addr.city, addr.state, addr.postcode, addr.country].filter(Boolean);
  if (!lines.length) return null;
  return (
    <div className="vdo-address-block">
      <div className="vdo-address-label">{label}</div>
      {lines.map((l, i) => <div key={i} className="vdo-address-line">{l}</div>)}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order,   setOrder]   = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Fulfilment
  const [updating,  setUpdating]  = useState(false);
  const [showTrack, setShowTrack] = useState(false);
  const [carrier,   setCarrier]   = useState("");
  const [trackNum,  setTrackNum]  = useState("");
  const [trackUrl,  setTrackUrl]  = useState("");
  const [savingTrack, setSavingTrack] = useState(false);

  // Notes
  const [noteText,   setNoteText]   = useState("");
  const [noteCustomer, setNoteCustomer] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/vendor/orders/${id}`)
      .then(async (r) => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return; }
        if (r.ok) {
          const data = await r.json();
          setOrder(data);
          // Pre-fill tracking if already set
          const meta = (data.metaData ?? []);
          setCarrier(meta.find((m: any) => m.key === "_tracking_carrier")?.value ?? "");
          setTrackNum(meta.find((m: any) => m.key === "_tracking_number")?.value ?? "");
          setTrackUrl(meta.find((m: any) => m.key === "_tracking_url")?.value ?? "");
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!order) return;
    setUpdating(true);
    try {
      const res  = await fetch(`/api/vendor/orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) setOrder({ ...order, status: newStatus });
    } finally { setUpdating(false); }
  }

  async function saveTracking() {
    if (!order) return;
    setSavingTrack(true);
    try {
      await fetch(`/api/vendor/orders/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingCarrier: carrier, trackingNumber: trackNum, trackingUrl: trackUrl }),
      });
      setShowTrack(false);
    } finally { setSavingTrack(false); }
  }

  async function addNote() {
    if (!noteText.trim() || !order) return;
    setAddingNote(true);
    try {
      const res  = await fetch(`/api/vendor/orders/${id}/notes`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText.trim(), customerNote: noteCustomer }),
      });
      if (res.ok) {
        const note = await res.json();
        setOrder({ ...order, notes: [note, ...order.notes] });
        setNoteText("");
      }
    } finally { setAddingNote(false); }
  }

  if (loading) return <div className="vd-page"><div className="vd-loading" style={{ minHeight: 300, position: "static" }}><div className="vd-loading-dot" /></div></div>;
  if (notFound || !order) return (
    <div className="vd-page">
      <div className="vd-empty-state">
        <div className="vd-empty-title">Order not found</div>
        <Link href="/vendor/orders" className="vd-btn-outline">Back to orders</Link>
      </div>
    </div>
  );

  const flow     = STATUS_FLOW[order.status] ?? { label: order.status, next: [] };
  const tracking = [carrier, trackNum].filter(Boolean).join(" — ");
  const customerName = `${order.customer.firstName} ${order.customer.lastName}`.trim() || "Guest";

  return (
    <div className="vd-page vdo-detail-page">
      {/* Header */}
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">
            <Link href="/vendor/orders" style={{ color: "inherit", textDecoration: "none" }}>Orders</Link>
            {" → "}#{order.number}
          </div>
          <div className="vdo-detail-title-row">
            <h1 className="vd-page-title" style={{ fontSize: "clamp(20px,2.5vw,28px)", margin: 0 }}>
              Order #{order.number}
            </h1>
            <span className={`vdo-status-badge ${STATUS_STYLE[order.status] ?? ""}`}>{flow.label}</span>
          </div>
          <div className="vdo-detail-meta">
            Placed {fmtDate(order.dateCreated)} · {order.paymentMethod || "Paid online"}
          </div>
        </div>
      </div>

      <div className="vdo-detail-grid">
        {/* ── Left column ── */}
        <div className="vdo-detail-main">

          {/* Items */}
          <section className="vdo-card">
            <div className="vdo-card-header">Items</div>
            <div className="vdo-items-list">
              {order.items.map((item) => (
                <div key={item.id} className="vdo-item-row">
                  <div className="vdo-item-img">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="56px" />
                    ) : <div className="vdo-item-img-placeholder" />}
                  </div>
                  <div className="vdo-item-body">
                    <div className="vdo-item-name">{item.name}</div>
                    {item.sku && <div className="vdo-item-sku">SKU: {item.sku}</div>}
                  </div>
                  <div className="vdo-item-qty">× {item.quantity}</div>
                  <div className="vdo-item-price">{item.total}</div>
                </div>
              ))}
            </div>
            <div className="vdo-totals">
              <div className="vdo-total-row">
                <span>Shipping</span><span>{order.shippingTotal}</span>
              </div>
              <div className="vdo-total-row vdo-total-row--bold">
                <span>Total</span><span>{order.total}</span>
              </div>
            </div>
          </section>

          {/* Fulfilment actions */}
          <section className="vdo-card">
            <div className="vdo-card-header">Fulfilment</div>

            {/* Status actions */}
            {flow.next.length > 0 && (
              <div className="vdo-action-row">
                {flow.next.map((action) => (
                  <button
                    key={action.value}
                    className={action.value === "cancelled" ? "vd-btn-outline vdo-btn-danger" : "vd-btn-primary"}
                    disabled={updating}
                    onClick={() => updateStatus(action.value)}
                    style={{ fontSize: 11 }}
                  >
                    {updating ? "Updating…" : action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tracking */}
            <div className="vdo-tracking-section">
              {tracking && !showTrack && (
                <div className="vdo-tracking-set">
                  <div className="vdo-tracking-label">Tracking</div>
                  <div className="vdo-tracking-value">{tracking}</div>
                  {trackUrl && <a href={trackUrl} target="_blank" rel="noopener noreferrer" className="vdo-tracking-link">Track parcel ↗</a>}
                </div>
              )}
              {!showTrack ? (
                <button className="vd-btn-outline" style={{ fontSize: 11, marginTop: 12 }} onClick={() => setShowTrack(true)}>
                  {tracking ? "Update tracking info" : "+ Add tracking info"}
                </button>
              ) : (
                <div className="vdo-tracking-form">
                  <div className="vdo-tracking-form-title">Tracking information</div>
                  <input className="vpf-input" placeholder="Carrier (e.g. Royal Mail, DHL)" value={carrier}  onChange={(e) => setCarrier(e.target.value)}  />
                  <input className="vpf-input" placeholder="Tracking number"                value={trackNum} onChange={(e) => setTrackNum(e.target.value)} />
                  <input className="vpf-input" placeholder="Tracking URL (optional)"        value={trackUrl} onChange={(e) => setTrackUrl(e.target.value)} type="url" />
                  <div className="vdo-action-row" style={{ marginTop: 8 }}>
                    <button className="vd-btn-primary" style={{ fontSize: 11 }} disabled={savingTrack} onClick={saveTracking}>
                      {savingTrack ? "Saving…" : "Save tracking"}
                    </button>
                    <button className="vd-btn-outline" style={{ fontSize: 11 }} onClick={() => setShowTrack(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Order notes */}
          <section className="vdo-card">
            <div className="vdo-card-header">Order notes</div>

            <div className="vdo-note-form">
              <textarea
                className="vpf-textarea vpf-textarea--sm"
                placeholder="Add a note — visible to you and optionally to the customer"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="vdo-note-form-footer">
                <label className="vdo-note-customer-toggle">
                  <input
                    type="checkbox"
                    checked={noteCustomer}
                    onChange={(e) => setNoteCustomer(e.target.checked)}
                  />
                  <span>Notify customer</span>
                </label>
                <button
                  className="vd-btn-primary"
                  style={{ fontSize: 11, padding: "9px 18px" }}
                  disabled={addingNote || !noteText.trim()}
                  onClick={addNote}
                >
                  {addingNote ? "Adding…" : "Add note"}
                </button>
              </div>
            </div>

            {order.notes.length > 0 && (
              <div className="vdo-notes-list">
                {order.notes.map((n) => (
                  <div key={n.id} className={`vdo-note${n.customerNote ? " vdo-note--customer" : ""}`}>
                    <div className="vdo-note-text" dangerouslySetInnerHTML={{ __html: n.note }} />
                    <div className="vdo-note-meta">
                      {fmtDate(n.dateCreated)}
                      {n.customerNote && <span className="vdo-note-tag">Sent to customer</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="vdo-detail-side">

          {/* Customer */}
          <section className="vdo-card">
            <div className="vdo-card-header">Customer</div>
            <div className="vdo-customer-name">{customerName}</div>
            <a href={`mailto:${order.customer.email}`} className="vdo-customer-email">{order.customer.email}</a>
            {order.customer.phone && <div className="vdo-customer-phone">{order.customer.phone}</div>}
          </section>

          {/* Addresses */}
          <section className="vdo-card">
            <div className="vdo-card-header">Addresses</div>
            <AddressBlock label="Ship to" addr={order.shipping} />
            <AddressBlock label="Bill to"  addr={order.billing}  />
          </section>

          {/* Customer note */}
          {order.customerNote && (
            <section className="vdo-card">
              <div className="vdo-card-header">Customer note</div>
              <p className="vdo-customer-note-text">{order.customerNote}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
