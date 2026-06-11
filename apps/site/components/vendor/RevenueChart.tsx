"use client";

interface DataPoint { date: string; revenue: number; }

interface Props {
  data: DataPoint[];
  currency?: string;
  height?: number;
}

function fmtAxisDate(iso: string, totalDays: number) {
  const d = new Date(iso);
  if (totalDays <= 7)  return d.toLocaleDateString("en-GB", { weekday: "short" });
  if (totalDays <= 31) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function RevenueChart({ data, currency = "£", height = 200 }: Props) {
  if (!data.length) return null;

  const W = 800;
  const H = height;
  const padL = 52, padR = 16, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.revenue), 0.01);
  const yTop   = maxVal * 1.12;

  // Choose ~4 y-axis ticks
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) =>
    parseFloat(((yTop / yTickCount) * i).toFixed(2))
  );

  const xStepPx = chartW / Math.max(data.length - 1, 1);

  function cx(i: number) { return padL + i * xStepPx; }
  function cy(v: number) { return padT + chartH - (v / yTop) * chartH; }

  // Build smooth path (cardinal spline approximation via cubic bezier)
  function smoothPath(pts: [number, number][]): string {
    if (pts.length < 2) return "";
    const tension = 0.3;
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  const pts: [number, number][] = data.map((d, i) => [cx(i), cy(d.revenue)]);
  const linePath  = smoothPath(pts);
  const areaPath  = linePath
    + ` L ${pts[pts.length - 1][0]},${padT + chartH} L ${pts[0][0]},${padT + chartH} Z`;

  // X-axis label positions — show up to 6 evenly spaced
  const labelStep = Math.max(1, Math.floor(data.length / 6));
  const xLabels   = data
    .map((d, i) => ({ i, d }))
    .filter(({ i }) => i % labelStep === 0 || i === data.length - 1);

  const totalDays = data.length;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id="vda-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--ochre)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--ochre)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Y grid lines + labels */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={padL} y1={cy(v)} x2={padL + chartW} y2={cy(v)}
            stroke="var(--rule)" strokeWidth={1}
          />
          <text
            x={padL - 6} y={cy(v) + 4}
            textAnchor="end"
            fontSize={10}
            fill="var(--mute)"
            fontFamily="var(--font-sans)"
          >
            {v === 0 ? "0" : `${currency}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`}
          </text>
        </g>
      ))}

      {/* Area fill */}
      <path d={areaPath} fill="url(#vda-area-grad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--ochre)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {pts.map(([x, y], i) => (
        data[i].revenue > 0 && (
          <circle key={i} cx={x} cy={y} r={3} fill="var(--ochre)" />
        )
      ))}

      {/* X labels */}
      {xLabels.map(({ i, d }) => (
        <text
          key={i}
          x={cx(i)}
          y={padT + chartH + 20}
          textAnchor="middle"
          fontSize={9}
          fill="var(--mute)"
          fontFamily="var(--font-sans)"
        >
          {fmtAxisDate(d.date, totalDays)}
        </text>
      ))}
    </svg>
  );
}
