"use client";

import { initials } from "@/lib/format";
import { INSIGHT_THRESHOLD } from "@/lib/insights";

const TILE = ["#3d6bff", "#1b2d4f", "#f07a3a", "#2f9e6b", "#7aa0ff", "#c45c3e"];

function hash(s: string) {
  let n = 0;
  for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n;
}

export function BrandMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  const bg = light ? "#fff" : "#1B2D4F";
  const fg = light ? "#1B2D4F" : "#fff";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="12" fill={bg} />
      <path
        d="M13 28V12h7.1c3.8 0 6.2 2 6.2 5.1 0 2.2-1.2 3.9-3.4 4.6L28.8 28h-4.6l-5.4-6.6H17V28H13zm4-10.4h2.6c1.8 0 2.9-.9 2.9-2.4s-1.1-2.3-2.9-2.3H17v4.7z"
        fill={fg}
      />
      <circle cx="31.5" cy="10.5" r="3.5" fill="#3D6BFF" />
    </svg>
  );
}

export function PencilIco() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14.2 5.2 18.8 9.8 8.6 20H4v-4.6L14.2 5.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12.6 6.8 17.2 11.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function FolderIco() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h4.2l1.6 2H18.5A1.5 1.5 0 0 1 20 9.5v8A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Chevron() {
  return (
    <svg className="chev-ico" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M6.5 3.5 12 9 6.5 14.5" stroke="#c5ccda" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StockTile({ name, code }: { name: string; code: string }) {
  const color = TILE[hash(`${code}:${name}`) % TILE.length];
  const latin = /^[A-Za-z]/.test(code);
  const label = latin ? code.slice(0, 2).toUpperCase() : initials(name);
  return (
    <span className="stock-tile" style={{ background: color }} aria-hidden>
      {label}
    </span>
  );
}

export function ProgressRing({
  side,
  count,
  remain,
  stalled = false,
}: {
  side: "buy" | "sell";
  count: number;
  remain: number;
  stalled?: boolean;
}) {
  const max = INSIGHT_THRESHOLD;
  const shown = Math.min(count, max);
  const pct = Math.min(100, (count / max) * 100);
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const color = side === "buy" ? "#3d6bff" : "#f07a3a";
  return (
    <div className={`progress-card ${side}`}>
      <div className={`k ${side}`}>{side === "buy" ? "매수" : "매도"}</div>
      <div className="ring-row">
        <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
          <circle cx="36" cy="36" r={r} fill="none" stroke="#eef1f6" strokeWidth="7" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            transform="rotate(-90 36 36)"
          />
          <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1b2d4f">
            {shown}/{max}
          </text>
        </svg>
        <p>
          {remain === 0
            ? stalled
              ? "아직 눈에 띄는 경향이 확인되지 않았어요. 기록을 추가해보세요."
              : "인사이트 카드를 확인할 수 있어요"
            : `인사이트 카드 발행까지 ${remain}건 남아 있어요`}
        </p>
      </div>
    </div>
  );
}

export function HomeIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
export function PlanIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={on ? 1.6 : 1.8}>
      <path d="M5 8.2A2.2 2.2 0 0 1 7.2 6h3.3l1.5 2H16.8A2.2 2.2 0 0 1 19 10.2v7.6A2.2 2.2 0 0 1 16.8 20H7.2A2.2 2.2 0 0 1 5 17.8V8.2Z" />
    </svg>
  );
}
export function RecordIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth={on ? 1.6 : 1.8}>
      <path d="M7 4h8l5 5v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      {!on ? <path d="M15 4v6h6" /> : null}
    </svg>
  );
}
export function InsightIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8}>
      <path d="M5 17V10M10 17V7M15 17v-5M20 17V9" strokeLinecap="round" />
    </svg>
  );
}
