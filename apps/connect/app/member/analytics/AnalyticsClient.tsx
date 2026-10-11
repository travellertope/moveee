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

// ── How to Earn — static table ───────────────────────────────────────────────

const HOW_TO_EARN = [
  { action: "Create a post",       credits: "+3",  points: "+15" },
  { action: "Get a reaction",      credits: "+1",  points: "+5"  },
  { action: "Get a comment",       credits: "+2",  points: "+8"  },
  { action: "Refer a new member",  credits: "+10", points: "+25" },
  { action: "Complete your profile", credits: "+5", points: "+20" },
  { action: "Daily visit",         credits: "+1",  points: "+3"  },
  { action: "Attend an event",     credits: "+5",  points: "+15" },
];

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

      <polygon points={areaPoints} fill={color} fillOpacity={0.08} />

      {vals.length > 1 && (
        <polyline points={polyline} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {vals.map((v, i) => {
        const [x, y] = points[i].split(",").map(Number);
        return <circle key={i} cx={x} cy={y} r={2.5} fill={color} />;
      })}

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

// ── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsClient({ userId, isPatron }: { userId: string; isPatron: boolean }) {
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
        Could not load dashboard. Please try again later.
      </div>
    );
  }

  const skeleton = !data;

  const totalEarned = data ? data.credit_days.reduce((s, d) => s + parseFloat(d.earned ?? "0"), 0) : 0;
  const totalSpent  = data ? data.credit_days.reduce((s, d) => s + parseFloat(d.spent ?? "0"), 0) : 0;

  const STAT_CARDS = [
    {
      label: "Credits",
      value: skeleton ? "—" : data!.balance.toLocaleString(),
      sub: "spendable balance",
      icon: "💳",
    },
    {
      label: "Points",
      value: skeleton ? "—" : data!.reputation.toLocaleString(),
      sub: "reputation score",
      icon: "⭐",
    },
    {
      label: "Badges",
      value: skeleton ? "—" : String(data!.badge_count),
      sub: "earned",
      icon: "🏅",
    },
    {
      label: "Posts",
      value: skeleton ? "—" : String(data!.posts_published),
      sub: data && data.posts_pending ? `+${data.posts_pending} pending` : "published",
      icon: "✏️",
    },
    {
      label: "Membership",
      value: isPatron ? "Pro" : "Citizen",
      sub: isPatron ? "Moveee Pro" : "Free tier",
      icon: isPatron ? "🌟" : "👤",
      accent: isPatron,
    },
  ];

  return (
    <>
      {/* ── Stat cards grid ── */}
      <div className="dash-stat-grid">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className={`dash-stat-card${card.accent ? " dash-stat-card--accent" : ""}`}
          >
            <div className="dash-stat-icon">{card.icon}</div>
            <div className="dash-stat-label">{card.label}</div>
            <div className="dash-stat-value">{card.value}</div>
            <div className="dash-stat-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Credits chart ── */}
      {(skeleton || (data && data.credit_days.length > 0)) && (
        <section className="dash-chart-card">
          <div className="an-chart-title">Credits — Last 30 Days</div>
          {skeleton ? (
            <div className="dash-chart-skeleton" />
          ) : data!.credit_days.length === 0 ? null : (
            <BarChart
              data={data!.credit_days}
              bars={["earned", "spent"]}
              colors={["#b38238", "#7a241c"]}
              labels={["Earned", "Spent"]}
            />
          )}
        </section>
      )}

      {/* ── Points chart ── */}
      {(skeleton || (data && data.rep_months.length > 0)) && (
        <section className="dash-chart-card">
          <div className="an-chart-title">Points Earned — Last 6 Months</div>
          {skeleton ? (
            <div className="dash-chart-skeleton" />
          ) : data!.rep_months.length === 0 ? null : (
            <LineChart data={data!.rep_months} valueKey="rep_earned" color="#2a6496" />
          )}
        </section>
      )}

      {/* ── How to Earn ── */}
      <section className="dash-chart-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="an-chart-title" style={{ padding: "18px 22px 14px" }}>How to Earn Credits & Points</div>
        <table className="dash-earn-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Credits</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {HOW_TO_EARN.map((row) => (
              <tr key={row.action}>
                <td>{row.action}</td>
                <td className="dash-earn-val dash-earn-val--credit">{row.credits}</td>
                <td className="dash-earn-val dash-earn-val--point">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 22px", borderTop: "1px solid var(--rule, #e8e2d8)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--mute)" }}>
            <strong style={{ color: "var(--ink)" }}>Earned (30d):</strong>{" "}
            {skeleton ? "—" : `${Math.round(totalEarned)} credits · ${data!.rep_months.reduce((s, m) => s + parseFloat(m.rep_earned ?? "0"), 0).toLocaleString()} pts`}
            <span style={{ marginLeft: "16px" }}>
              <strong style={{ color: "var(--ink)" }}>Spent (30d):</strong>{" "}
              {skeleton ? "—" : `${Math.round(totalSpent)} credits`}
            </span>
          </div>
        </div>
      </section>

      {/* ── Top posts ── */}
      {(skeleton || (data && data.top_posts.length > 0)) && (
        <section className="dash-chart-card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="an-chart-title" style={{ padding: "18px 22px 0", marginBottom: 8 }}>Top Posts — Last 90 Days</div>
          {skeleton ? (
            <div style={{ padding: "0 22px 20px" }}>
              {[1, 2, 3].map(i => <div key={i} className="dash-chart-skeleton" style={{ height: "48px", marginBottom: "8px" }} />)}
            </div>
          ) : data!.top_posts.length === 0 ? (
            <p style={{ fontSize: "0.78rem", color: "var(--mute)", padding: "0 22px 20px" }}>No published posts yet.</p>
          ) : (
            data!.top_posts.map((p, i) => {
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
      )}
    </>
  );
}
