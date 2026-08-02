"use client";

import { useState, useEffect } from "react";

interface CreditDay {
  day: string;
  earned: string;
  spent: string;
  [key: string]: string;
}

interface RepMonth {
  month: string;
  rep_earned: string;
  [key: string]: string;
}

interface TopPost {
  ID: string;
  post_title: string;
  post_date: string;
  reactions: string;
  comment_count: string;
}

interface AnalyticsData {
  balance: number;
  reputation: number;
  posts_published: number;
  posts_pending: number;
  badge_count: number;
  notification_count: number;
  credit_days: CreditDay[];
  rep_months: RepMonth[];
  top_posts: TopPost[];
}

// ── SVG Bar Chart ────────────────────────────────────────────────────────────

function BarChart({
  data,
  bars,
  colors,
  labels,
  height = 140,
}: {
  data: Record<string, string>[];
  bars: string[];
  colors: string[];
  labels: string[];
  height?: number;
}) {
  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 32, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    1,
    ...data.flatMap((d) => bars.map((b) => parseFloat(d[b] ?? "0")))
  );

  const groupW = chartW / Math.max(data.length, 1);
  const barW = Math.max(2, (groupW / bars.length) * 0.7);
  const gap = (groupW - barW * bars.length) / 2;

  const yTicks = 4;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Y axis ticks */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const val = Math.round((maxVal * i) / yTicks);
        const y = PAD.top + chartH - (chartH * i) / yTicks;
        return (
          <g key={i}>
            <line x1={PAD.left - 4} x2={PAD.left + chartW} y1={y} y2={y} stroke="#c8bfb0" strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#7a6f5c">{val}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, gi) => {
        const xBase = PAD.left + gi * groupW + gap;
        return bars.map((b, bi) => {
          const val = parseFloat(d[b] ?? "0");
          const barH = val === 0 ? 1 : Math.max(2, (val / maxVal) * chartH);
          const x = xBase + bi * barW;
          const y = PAD.top + chartH - barH;
          return (
            <g key={`${gi}-${bi}`}>
              <rect x={x} y={y} width={barW - 1} height={barH} fill={colors[bi]} rx={1} />
            </g>
          );
        });
      })}

      {/* X axis labels — show every Nth to avoid crowding */}
      {data.map((d, gi) => {
        const step = Math.ceil(data.length / 10);
        if (gi % step !== 0) return null;
        const x = PAD.left + gi * groupW + groupW / 2;
        const label = d["_label"] ?? d["day"] ?? d["month"] ?? "";
        const short = label.length > 5 ? label.slice(5) : label;
        return (
          <text key={gi} x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#7a6f5c">
            {short}
          </text>
        );
      })}

      {/* Legend */}
      {bars.map((b, bi) => (
        <g key={b} transform={`translate(${PAD.left + bi * 80}, ${H - 6})`}>
          <rect width={8} height={8} fill={colors[bi]} rx={1} />
          <text x={11} y={8} fontSize={9} fill="#7a6f5c">{labels[bi]}</text>
        </g>
      ))}
    </svg>
  );
}

// ── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({
  data,
  valueKey,
  color = "#b38238",
  height = 120,
}: {
  data: Record<string, string>[];
  valueKey: string;
  color?: string;
  height?: number;
}) {
  const W = 600;
  const H = height;
  const PAD = { top: 12, right: 8, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const vals = data.map((d) => parseFloat(d[valueKey] ?? "0"));
  const maxVal = Math.max(1, ...vals);

  const points = vals.map((v, i) => {
    const x = PAD.left + (i / Math.max(vals.length - 1, 1)) * chartW;
    const y = PAD.top + chartH - (v / maxVal) * chartH;
    return `${x},${y}`;
  });

  const polyline = points.join(" ");
  const areaPoints = [
    `${PAD.left},${PAD.top + chartH}`,
    ...points,
    `${PAD.left + chartW},${PAD.top + chartH}`,
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = PAD.top + chartH - t * chartH;
        const val = Math.round(maxVal * t);
        return (
          <g key={t}>
            <line x1={PAD.left} x2={PAD.left + chartW} y1={y} y2={y} stroke="#c8bfb0" strokeWidth={0.5} strokeDasharray="4 4" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#7a6f5c">{val}</text>
          </g>
        );
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill={color} fillOpacity={0.08} />

      {/* Line */}
      {vals.length > 1 && (
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* Dots */}
      {vals.map((v, i) => {
        const [x, y] = points[i].split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
      })}

      {/* X labels */}
      {data.map((d, i) => {
        const step = Math.ceil(data.length / 6);
        if (i % step !== 0 && i !== data.length - 1) return null;
        const x = PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const label = d["month"] ?? d["day"] ?? "";
        const short = label.length > 7 ? label.slice(2) : label;
        return (
          <text key={i} x={x} y={H - PAD.bottom + 14} textAnchor="middle" fontSize={8} fill="#7a6f5c">
            {short}
          </text>
        );
      })}
    </svg>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, valueColor }: { label: string; value: string | number; sub?: string; valueColor?: string }) {
  return (
    <div className="an-stat">
      <div className="an-stat-label">{label}</div>
      <div className="an-stat-value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
      {sub && <div className="an-stat-sub">{sub}</div>}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ userId }: { userId: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/member/analytics")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, [userId]);

  if (error) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--mute)", fontSize: "0.85rem" }}>
        Could not load analytics. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: "var(--mute)", fontSize: "0.85rem" }}>
        Loading analytics…
      </div>
    );
  }

  const totalEarned = data.credit_days.reduce((s, d) => s + parseFloat(d.earned ?? "0"), 0);
  const totalSpent  = data.credit_days.reduce((s, d) => s + parseFloat(d.spent ?? "0"), 0);

  return (
    <>
      {/* ── Stat summary ── */}
      <div className="an-stats">
        <StatCard label="Credit Balance" value={data.balance} sub="spendable credits" />
        <StatCard label="Points" value={data.reputation} sub="all-time points" />
        <StatCard label="Posts" value={data.posts_published} sub={data.posts_pending ? `+${data.posts_pending} pending` : "published"} />
        <StatCard label="Badges" value={data.badge_count} sub="earned badges" />
        <StatCard label="Earned (30d)" value={Math.round(totalEarned)} sub="credits earned" valueColor="var(--success)" />
        <StatCard label="Spent (30d)" value={Math.round(totalSpent)} sub="credits spent" valueColor="var(--error)" />
      </div>

      {/* ── Credits chart ── */}
      <section className="acct-card" style={{ marginBottom: 20 }}>
        <div className="an-chart-title">Credits — Last 30 Days</div>
        {data.credit_days.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--mute)", margin: 0 }}>No credit activity in the last 30 days.</p>
        ) : (
          <BarChart
            data={data.credit_days}
            bars={["earned", "spent"]}
            colors={["#b38238", "#c5491f"]}
            labels={["Earned", "Spent"]}
          />
        )}
      </section>

      {/* ── Points chart ── */}
      <section className="acct-card" style={{ marginBottom: 20 }}>
        <div className="an-chart-title">Points Earned — Last 6 Months</div>
        {data.rep_months.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--mute)", margin: 0 }}>No points activity yet.</p>
        ) : (
          <LineChart data={data.rep_months} valueKey="rep_earned" color="#2a6496" />
        )}
      </section>

      {/* ── Top posts ── */}
      <section className="acct-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="an-chart-title" style={{ padding: "18px 22px 0", marginBottom: 8 }}>Top Posts — Last 90 Days</div>
        {data.top_posts.length === 0 ? (
          <p style={{ fontSize: "0.78rem", color: "var(--mute)", padding: "0 22px 20px" }}>No published posts yet.</p>
        ) : (
          data.top_posts.map((p, i) => {
            const engagement = parseInt(p.reactions ?? "0") + parseInt(p.comment_count ?? "0");
            return (
              <div key={p.ID} className="an-post-row">
                <div className={`an-rank${i === 0 ? " an-rank--1" : ""}`}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="an-post-title">{p.post_title || "Untitled"}</div>
                  <div className="an-post-date">
                    {new Date(p.post_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <div className="an-post-eng"><span>❤️ {p.reactions ?? 0}</span><span>💬 {p.comment_count ?? 0}</span></div>
                  <div className="an-post-total">{engagement} Eng</div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </>
  );
}
