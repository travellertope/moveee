"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

interface DashStats {
  totalProducts: number;
  pendingOrders: number;
  totalEarnings: string;
  rating: string;
  recentOrders: {
    id: number;
    date: string;
    status: string;
    total: string;
    customer: string;
  }[];
}

async function fetchDashStats(vendorId: string): Promise<DashStats | null> {
  try {
    const res = await fetch(`/api/vendor/stats?vendor_id=${vendorId}`, {
      cache: "no-store",
    });
    if (res.ok) return res.json();
  } catch { /* fall through */ }
  return null;
}

export default function VendorDashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchDashStats(user.id).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [user?.id]);

  const storeName = user?.name || user?.username || "Your Store";

  const STAT_CARDS = [
    {
      label: "Products listed",
      value: loading ? "—" : String(stats?.totalProducts ?? 0),
      cta:   { label: "Manage products", href: "/vendor/products" },
    },
    {
      label: "Pending orders",
      value: loading ? "—" : String(stats?.pendingOrders ?? 0),
      cta:   { label: "View orders", href: "/vendor/orders" },
    },
    {
      label: "Total earnings",
      value: loading ? "—" : (stats?.totalEarnings ?? "£0.00"),
      cta:   { label: "See analytics", href: "/vendor/analytics" },
    },
    {
      label: "Store rating",
      value: loading ? "—" : (stats?.rating ? `★ ${stats.rating}` : "★ New"),
      cta:   { label: "View storefront", href: `/makers/${user?.vendorSlug}` },
    },
  ];

  return (
    <div className="vd-page">
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">Moveee Marketplace</div>
          <h1 className="vd-page-title">
            Welcome back, <em>{storeName}</em>
          </h1>
        </div>
        <Link href="/vendor/products/new" className="vd-btn-primary">
          + Add product
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="vd-stats-grid">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="vd-stat-card">
            <div className="vd-stat-label">{card.label}</div>
            <div className="vd-stat-value">{card.value}</div>
            <Link href={card.cta.href} className="vd-stat-cta">
              {card.cta.label} →
            </Link>
          </div>
        ))}
      </div>

      {/* ── Recent orders ── */}
      {stats?.recentOrders && stats.recentOrders.length > 0 ? (
        <section className="vd-section">
          <div className="vd-section-header">
            <h2 className="vd-section-title">Recent orders</h2>
            <Link href="/vendor/orders" className="vd-section-all">
              View all →
            </Link>
          </div>
          <div className="vd-table-wrap">
            <table className="vd-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/vendor/orders/${o.id}`} className="vd-table-link">
                        #{o.id}
                      </Link>
                    </td>
                    <td>{o.customer}</td>
                    <td>{new Date(o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
                    <td>{o.total}</td>
                    <td>
                      <span className={`vd-order-status vd-order-status--${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : !loading && (
        <section className="vd-section">
          <div className="vd-empty-state">
            <div className="vd-empty-title">No orders yet</div>
            <p className="vd-empty-desc">
              Once customers purchase your products, orders will appear here.
            </p>
            <Link href="/vendor/products" className="vd-btn-outline">
              Add your first product →
            </Link>
          </div>
        </section>
      )}

      {/* ── Getting started checklist (for new vendors) ── */}
      {!loading && (stats?.totalProducts ?? 0) === 0 && (
        <section className="vd-section">
          <div className="vd-section-header">
            <h2 className="vd-section-title">Getting started</h2>
          </div>
          <div className="vd-checklist">
            {[
              {
                done: true,
                label: "Create your Moveee account",
                desc:  "You're in.",
              },
              {
                done: true,
                label: "Apply as a vendor",
                desc:  "Approved and activated.",
              },
              {
                done: false,
                label: "Complete your store profile",
                desc:  "Add your brand story, banner, and social links.",
                href:  "/vendor/profile",
              },
              {
                done: false,
                label: "Add your first product",
                desc:  "Upload photos, set your price, and go live.",
                href:  "/vendor/products/new",
              },
            ].map((item) => (
              <div key={item.label} className={`vd-checklist-item${item.done ? " done" : ""}`}>
                <div className="vd-checklist-check">{item.done ? "✓" : ""}</div>
                <div className="vd-checklist-body">
                  <div className="vd-checklist-label">{item.label}</div>
                  <div className="vd-checklist-desc">{item.desc}</div>
                </div>
                {!item.done && item.href && (
                  <Link href={item.href} className="vd-checklist-cta">
                    Do this →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
