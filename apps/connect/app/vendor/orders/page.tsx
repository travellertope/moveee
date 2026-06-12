"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface OrderItem { id: number; name: string; quantity: number; image: string | null; }
interface Order {
  id: number; number: string; status: string; dateCreated: string;
  total: string; customer: { firstName: string; lastName: string; email: string; };
  items: OrderItem[];
}
interface OrdersData { items: Order[]; total: number; pages: number; }

const STATUS_OPTIONS = [
  { value: "any",        label: "All orders"  },
  { value: "pending",    label: "Pending"     },
  { value: "processing", label: "Processing"  },
  { value: "on-hold",    label: "On hold"     },
  { value: "completed",  label: "Completed"   },
  { value: "cancelled",  label: "Cancelled"   },
  { value: "refunded",   label: "Refunded"    },
];

const STATUS_STYLE: Record<string, string> = {
  pending:    "vdo-status--pending",
  processing: "vdo-status--processing",
  "on-hold":  "vdo-status--hold",
  completed:  "vdo-status--completed",
  cancelled:  "vdo-status--cancelled",
  refunded:   "vdo-status--refunded",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function VendorOrdersPage() {
  const [data,    setData]    = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState("any");
  const [search,  setSearch]  = useState("");
  const [query,   setQuery]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page), per_page: "20", status,
        ...(query ? { search: query } : {}),
      });
      const res = await fetch(`/api/vendor/orders?${params}`);
      if (res.ok) setData(await res.json());
    } finally { setLoading(false); }
  }, [page, status, query]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="vd-page">
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">Your Store</div>
          <h1 className="vd-page-title">Orders</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="vdp-filters">
        <div className="vdp-search-wrap">
          <input
            className="vdp-search"
            type="search"
            placeholder="Search by order # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); setQuery(search); } }}
          />
          {search && (
            <button className="vdp-search-clear" onClick={() => { setSearch(""); setQuery(""); setPage(1); }}>✕</button>
          )}
        </div>
        <div className="vdp-status-tabs">
          {STATUS_OPTIONS.slice(0, 5).map((s) => (
            <button
              key={s.value}
              className={`vdp-status-tab${status === s.value ? " active" : ""}`}
              onClick={() => { setStatus(s.value); setPage(1); }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="vd-loading" style={{ minHeight: 200, position: "static" }}>
          <div className="vd-loading-dot" />
        </div>
      ) : !data?.items.length ? (
        <div className="vd-empty-state">
          <div className="vd-empty-title">No orders yet</div>
          <p className="vd-empty-desc">
            {query ? `No orders matching "${query}".` : "Orders will appear here once customers purchase your products."}
          </p>
        </div>
      ) : (
        <>
          <div className="vdo-list">
            {data.items.map((order) => {
              const customerName = `${order.customer.firstName} ${order.customer.lastName}`.trim() || "Guest";
              return (
                <Link key={order.id} href={`/vendor/orders/${order.id}`} className="vdo-row">
                  <div className="vdo-row-main">
                    <div className="vdo-row-top">
                      <span className="vdo-order-num">Order #{order.number}</span>
                      <span className={`vdo-status-badge ${STATUS_STYLE[order.status] ?? ""}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="vdo-row-meta">
                      <span className="vdo-customer">{customerName}</span>
                      <span className="vdo-sep">·</span>
                      <span className="vdo-date">{fmtDate(order.dateCreated)}</span>
                      <span className="vdo-sep">·</span>
                      <span className="vdo-total">{order.total}</span>
                    </div>
                    {order.items.length > 0 && (
                      <div className="vdo-items-preview">
                        {order.items.slice(0, 4).map((item) => (
                          <div key={item.id} className="vdo-item-thumb" title={item.name}>
                            {item.image ? (
                              <Image src={item.image} alt={item.name} fill style={{ objectFit: "cover" }} sizes="36px" />
                            ) : (
                              <div className="vdo-item-thumb-placeholder" />
                            )}
                          </div>
                        ))}
                        {order.items.length > 4 && (
                          <div className="vdo-item-more">+{order.items.length - 4}</div>
                        )}
                        <span className="vdo-items-label">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} item{order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="vdo-row-arrow">→</div>
                </Link>
              );
            })}
          </div>

          {data.pages > 1 && (
            <div className="vdp-pagination">
              <button className="vdp-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="vdp-page-info">Page {page} of {data.pages} · {data.total} orders</span>
              <button className="vdp-page-btn" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
