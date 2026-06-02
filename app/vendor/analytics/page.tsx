"use client";

import { useEffect, useState } from "react";
import RevenueChart from "@/components/vendor/RevenueChart";

type Period = "7d" | "30d" | "90d" | "1y";

interface AnalyticsData {
  period: Period;
  currency: string;
  summary: {
    totalRevenue: number;
    orderCount: number;
    avgOrderValue: number;
    itemsSold: number;
  };
  earnings: {
    gross: number;
    commission: number;
    commissionRate: number;
    net: number;
    pendingPayout: number;
  };
  chart: { date: string; revenue: number }[];
  topProducts: { id: number; name: string; revenue: number; qty: number; image: string | null }[];
  statusBreakdown: { status: string; count: number }[];
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "7d",  label: "7 days"  },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "1y",  label: "1 year"  },
];

const STATUS_STYLE: Record<string, string> = {
  pending:    "vdo-status--pending",
  processing: "vdo-status--processing",
  "on-hold":  "vdo-status--hold",
  completed:  "vdo-status--completed",
  cancelled:  "vdo-status--cancelled",
  refunded:   "vdo-status--refunded",
};

function fmt(currency: string, n: number) {
  return `${currency}${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function VendorAnalyticsPage() {
  const [period,  setPeriod]  = useState<Period>("30d");
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    fetch(`/api/vendor/analytics?period=${period}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [period]);

  const cur = data?.currency ?? "£";

  return (
    <div className="vd-page">
      <div className="vd-page-header">
        <div>
          <div className="vd-page-eyebrow">Your Store</div>
          <h1 className="vd-page-title">Analytics</h1>
        </div>
        <div className="vda-period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              className={`vda-period-tab${period === p.value ? " active" : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="vd-loading" style={{ minHeight: 300, position: "static" }}>
          <div className="vd-loading-dot" />
        </div>
      ) : !data ? (
        <div className="vd-empty-state">
          <div className="vd-empty-title">Could not load analytics</div>
          <p className="vd-empty-desc">Please try again shortly.</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="vda-summary-grid">
            <div className="vda-stat-card">
              <div className="vda-stat-label">Total revenue</div>
              <div className="vda-stat-value">{fmt(cur, data.summary.totalRevenue)}</div>
            </div>
            <div className="vda-stat-card">
              <div className="vda-stat-label">Orders</div>
              <div className="vda-stat-value">{data.summary.orderCount}</div>
            </div>
            <div className="vda-stat-card">
              <div className="vda-stat-label">Avg order value</div>
              <div className="vda-stat-value">{fmt(cur, data.summary.avgOrderValue)}</div>
            </div>
            <div className="vda-stat-card">
              <div className="vda-stat-label">Items sold</div>
              <div className="vda-stat-value">{data.summary.itemsSold}</div>
            </div>
          </div>

          {/* Revenue chart */}
          <section className="vda-card">
            <div className="vda-card-header">
              <span>Revenue over time</span>
              <span className="vda-card-sub">{PERIODS.find((p) => p.value === period)?.label}</span>
            </div>
            <div className="vda-chart-wrap">
              {data.chart.every((d) => d.revenue === 0) ? (
                <div className="vda-chart-empty">No sales in this period</div>
              ) : (
                <RevenueChart data={data.chart} currency={cur} height={220} />
              )}
            </div>
          </section>

          <div className="vda-lower-grid">
            {/* Earnings breakdown */}
            <section className="vda-card">
              <div className="vda-card-header">Earnings breakdown</div>
              <div className="vda-earnings-rows">
                <div className="vda-earn-row">
                  <span>Gross sales</span>
                  <span>{fmt(cur, data.earnings.gross)}</span>
                </div>
                <div className="vda-earn-row vda-earn-row--sub">
                  <span>Platform fee ({data.earnings.commissionRate}%)</span>
                  <span>−{fmt(cur, data.earnings.commission)}</span>
                </div>
                <div className="vda-earn-row vda-earn-row--total">
                  <span>Net earnings</span>
                  <span>{fmt(cur, data.earnings.net)}</span>
                </div>
                {data.earnings.pendingPayout > 0 && (
                  <div className="vda-earn-row vda-earn-row--payout">
                    <span>Pending payout</span>
                    <span>{fmt(cur, data.earnings.pendingPayout)}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Top products */}
            <section className="vda-card">
              <div className="vda-card-header">Top products</div>
              {data.topProducts.length === 0 ? (
                <div className="vda-empty-msg">No product sales in this period.</div>
              ) : (
                <ol className="vda-top-products">
                  {data.topProducts.map((p, i) => (
                    <li key={p.id} className="vda-top-product-row">
                      <span className="vda-rank">{i + 1}</span>
                      {p.image && (
                        <img src={p.image} alt={p.name} className="vda-product-thumb" />
                      )}
                      <span className="vda-product-name">{p.name}</span>
                      <span className="vda-product-meta">{p.qty} sold</span>
                      <span className="vda-product-rev">{fmt(cur, p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* Order status breakdown */}
            <section className="vda-card">
              <div className="vda-card-header">Order status breakdown</div>
              {data.statusBreakdown.length === 0 ? (
                <div className="vda-empty-msg">No orders in this period.</div>
              ) : (
                <div className="vda-status-breakdown">
                  {(() => {
                    const total = data.statusBreakdown.reduce((s, r) => s + r.count, 0);
                    return data.statusBreakdown.map((row) => (
                      <div key={row.status} className="vda-status-row">
                        <span className={`vdo-status-badge ${STATUS_STYLE[row.status] ?? ""}`} style={{ fontSize: 10 }}>
                          {row.status}
                        </span>
                        <div className="vda-status-bar-wrap">
                          <div
                            className="vda-status-bar"
                            style={{ width: `${Math.round((row.count / total) * 100)}%` }}
                          />
                        </div>
                        <span className="vda-status-count">{row.count}</span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
