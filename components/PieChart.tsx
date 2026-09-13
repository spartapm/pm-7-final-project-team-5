"use client";

const PIE = ["#252F4A", "#476B9E", "#738CAD", "#A6B8D1", "#D9E3F0", "#EEF2FA"];

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
}

function wedge(cx: number, cy: number, r: number, start: number, end: number) {
  if (end - start >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
  }
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export function PieChart({
  slices,
  emptyLabel,
  palette = PIE,
  size = 96,
}: {
  slices: [string, number][];
  emptyLabel?: string;
  palette?: string[];
  size?: number;
}) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  const mid = size / 2;
  const r = Math.round(size * 0.48);
  if (!slices.length) {
    return (
      <div className="pie-empty">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={mid} cy={mid} r={r} fill="#EAEDF0" />
        </svg>
        <p className="sub">{emptyLabel || "아직 기록 없음"}</p>
      </div>
    );
  }
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pie-solid">
      {slices.slice(0, 6).map(([, n], i) => {
        const sweep = (n / total) * 360;
        const start = acc;
        const end = acc + sweep;
        acc = end;
        return <path key={i} d={wedge(mid, mid, r, start, end)} fill={palette[i % palette.length]} stroke="#fff" strokeWidth="2" />;
      })}
    </svg>
  );
}

export function PieLegend({
  slices,
  palette = PIE,
  compact = false,
}: {
  slices: [string, number][];
  palette?: string[];
  compact?: boolean;
}) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  return (
    <div className={compact ? "pie-legend compact" : "pie-legend"}>
      {slices.slice(0, compact ? 7 : 5).map(([name, n], i) => (
        <div key={name}>
          <i className="swatch" style={{ background: palette[i % palette.length] }} />
          <span className="legend-copy">
            <span className="legend-name">{name}</span>
            <span className="legend-meta">
              {n}건 · {Math.round((n / total) * 100)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
