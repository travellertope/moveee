"use client";

interface DataPoint {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: DataPoint[];
  currency?: string;
  height?: number;
}

export default function RevenueChart({ data, currency = "£", height = 220 }: RevenueChartProps) {
  if (!data.length) return null;

  const W = 600;
  const H = height;
  const PAD = { top: 16, right: 16, bottom: 40, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.revenue), 1);
  const minVal = 0;

  const xScale = (i: number) => PAD.left + (i / Math.max(data.length - 1, 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const points = data.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`).join(" ");

  const areaPoints = [
    `${PAD.left},${PAD.top + innerH}`,
    ...data.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`),
    `${xScale(data.length - 1)},${PAD.top + innerH}`,
  ].join(" ");

  const yTicks = 4;
  const fmt = (v: number) =>
    `${currency}${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`;

  const xLabelStep = Math.max(1, Math.floor(data.length / 6));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: "block", overflow: "visible" }}
      aria-label="Revenue chart"
    >
      <defs>
        <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--ochre, #b38238)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--ochre, #b38238)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y gridlines + labels */}
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const v = minVal + ((maxVal - minVal) * i) / yTicks;
        const y = yScale(v);
        return (
          <g key={i}>
            <line
              x1={PAD.left} y1={y} x2={PAD.left + innerW} y2={y}
              stroke="var(--rule, #e5ddd0)" strokeWidth={1}
            />
            <text
              x={PAD.left - 6} y={y + 4}
              textAnchor="end" fontSize={10}
              fill="var(--mute, #9b8f82)"
            >
              {fmt(v)}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <polygon points={areaPoints} fill="url(#rev-grad)" />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--ochre, #b38238)"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* X labels */}
      {data.map((d, i) => {
        if (i % xLabelStep !== 0 && i !== data.length - 1) return null;
        const label = d.date.slice(5); // MM-DD
        return (
          <text
            key={i}
            x={xScale(i)} y={H - 6}
            textAnchor="middle" fontSize={9}
            fill="var(--mute, #9b8f82)"
          >
            {label}
          </text>
        );
      })}

      {/* Dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)} cy={yScale(d.revenue)} r={3}
          fill="var(--ochre, #b38238)"
        >
          <title>{`${d.date}: ${currency}${d.revenue.toFixed(2)}`}</title>
        </circle>
      ))}
    </svg>
  );
}
