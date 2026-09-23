"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PieChart, PieLegend } from "@/components/PieChart";
import { LegalFooter, PhoneShell, TabBar } from "@/components/ui";
import { startRecordSession, track, trackOnce } from "@/lib/analytics";
import { reasonGroups } from "@/lib/categories";
import { comboTop3, reasonDistribution, reasonSubDistribution, sideTrades } from "@/lib/insights";
import { planFollowStats } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { Side, Trade } from "@/lib/types";

const EMPTY_PREVIEWS = [
  { src: "/figma/preview/trend.png", alt: "매매 추이 예시" },
  { src: "/figma/preview/plan.png", alt: "계획 이행 현황 예시" },
  { src: "/figma/preview/reason-overview.png", alt: "판단 이유 한눈에 보기 예시" },
  { src: "/figma/preview/reason-detail.png", alt: "판단 이유 자세히 보기 예시" },
  { src: "/figma/preview/combo.png", alt: "자주 겹치는 조합 TOP 3 예시" },
];
const CHART_BUY = "#476B9E";
const CHART_SELL = "#C99A3D";

export default function InsightsPage() {
  const router = useRouter();
  const { hydrated, trades } = useStore();
  const real = trades.filter((t) => !t.isPractice);
  const buyCount = sideTrades(trades, "buy").length;
  const sellCount = sideTrades(trades, "sell").length;
  const reasons = reasonDistribution(real);
  const top3 = comboTop3(trades);

  useEffect(() => {
    if (!hydrated) return;
    const dashboardState = real.length === 0 ? "empty" : "available";
    trackOnce(`dashboard_view:${dashboardState}`, "dashboard_view", {
      dashboard_state: dashboardState,
      record_count: real.length,
      available_chart_ids: real.length === 0 ? [] : ["trade_trend", "combo_top3", "reason_pie", "reason_detail", "plan_follow"],
      insight_available: false,
      screen_id: "4-1",
      screen_name: "insight_dashboard",
    });
  }, [hydrated, real.length]);

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="scroll tabbed">
        <div className="brand-kicker insight-kicker">인사이트</div>
        <h1 className="hello insight-hello">나의 기록 통계</h1>
        <p className="sub dash-lead">전체 매매 기록을 기준으로 정리했어요</p>

        {real.length >= 3 ? (
          <a
            className="survey-banner"
            href="https://docs.google.com/forms/d/e/1FAIpQLSfXQNu83adNp0nUhYyWEc1r2I2K6sbB6QnQnvOoraNbOccrvg/viewform"
            target="_blank"
            rel="noreferrer"
          >
            <img src="/figma/survey-banner.png" alt="인플롯 사용 경험 설문 · 3분" width={950} height={208} />
          </a>
        ) : null}

        {real.length === 0 ? (
          <EmptyDash />
        ) : (
          <Dashboard real={real} buyCount={buyCount} sellCount={sellCount} reasons={reasons} top3={top3} />
        )}
        <LegalFooter />
      </div>
      {real.length === 0 ? (
        <div className="footer-cta over-tabs">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              startRecordSession("dashboard", real.length);
              router.push("/record");
            }}
          >
            첫 매매 기록하기
          </button>
        </div>
      ) : null}
      <TabBar />
    </PhoneShell>
  );
}

function EmptyDash() {
  const [dot, setDot] = useState(0);
  const prev = useRef(0);
  function moveTo(next: number, method: "swipe" | "button") {
    const to = Math.min(4, Math.max(0, next));
    const from = prev.current;
    if (to === from) return;
    track("insight_preview_carousel_change", {
      from_slide_index: from,
      to_slide_index: to,
      change_method: method,
      total_slide_count: 5,
      screen_name: "insight_dashboard",
    });
    prev.current = to;
    setDot(to);
  }
  return (
    <>
      <h3>아직 기록이 없어요</h3>
      <p className="sub">매매를 기록하면 나만의 통계가 이렇게 채워져요</p>
      <div
        className="example-rail"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.78));
          moveTo(Math.min(4, Math.max(0, i)), "swipe");
        }}
      >
        {EMPTY_PREVIEWS.map((card) => (
          <div className="example-card preview" key={card.src}>
            <img src={card.src} alt={card.alt} width={780} height={510} />
          </div>
        ))}
      </div>
      <div className="dots">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={dot === i ? "on" : ""} />
        ))}
      </div>
    </>
  );
}

function Dashboard({
  real,
  buyCount,
  sellCount,
  reasons,
  top3,
}: {
  real: Trade[];
  buyCount: number;
  sellCount: number;
  reasons: [string, number][];
  top3: [string, number][];
}) {
  const [openCount, setOpenCount] = useState(false);
  return (
    <>
      <div className="card chart-card">
        <button className={openCount ? "acc-h open stack" : "acc-h stack"} type="button" onClick={() => setOpenCount((v) => !v)}>
          <span className="acc-copy">
            <b>📌 매매 개요</b>
            {!openCount ? <span>총 기록 건수 및 일별 매매 추이</span> : null}
          </span>
          <span>{openCount ? "⌃" : "⌄"}</span>
        </button>
        {openCount ? (
          <>
            <div className="stat-num">{real.length}건</div>
            <div className="sub">지금까지 기록한 매매</div>
            <div className="stat-split">매수 {buyCount}건 · 매도 {sellCount}건</div>
            <h2 className="chart-title">📈 매매 추이 · 매매 유형별 (일자별)</h2>
            <LineChart trades={real} />
          </>
        ) : null}
      </div>
      <div className="card chart-card">
        <h2 className="chart-title">🔗 자주 겹치는 조합 · TOP 3</h2>
        {top3.length === 0 ? (
          <p className="sub">아직 겹치는 조합이 없어요</p>
        ) : (
          top3.map(([name, n], i) => <HBar key={name} rank={i + 1} label={name} value={n} max={top3[0]![1]} tone="default" />)
        )}
      </div>
      <div className="card chart-card">
        <h2 className="chart-title">📊 판단 이유 한눈에 보기</h2>
        {reasons.length === 0 ? (
          <p className="sub">판단 근거를 고른 기록이 아직 없어요.</p>
        ) : (
          <div className="pie-wrap overview">
            <PieChart slices={reasons} size={120} />
            <PieLegend slices={reasons} />
          </div>
        )}
      </div>
      <ReasonDetail real={real} />
      <PlanFollowCard trades={real} />
    </>
  );
}

function ReasonDetail({ real }: { real: Trade[] }) {
  const [open, setOpen] = useState(false);
  const groups = reasonGroups()
    .map((g) => {
      const slices = reasonSubDistribution(real, g.group);
      if (!slices.length) return null;
      const count = slices.reduce((s, x) => s + x[1], 0);
      const latest = Math.max(
        0,
        ...real.filter((t) => t.reasons.some((r) => (r.group || "기타") === g.group)).map((t) => t.createdAt)
      );
      return { group: g.group, slices, count, latest };
    })
    .filter((x): x is { group: string; slices: [string, number][]; count: number; latest: number } => Boolean(x))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.latest - a.latest));
  const shown = open ? groups : groups.slice(0, 1);
  return (
    <div className="card chart-card">
      <button className={open ? "acc-h open" : "acc-h"} type="button" onClick={() => setOpen((v) => !v)}>
        📊 판단 이유 자세히 보기
        <span>{open ? "⌃" : "⌄"}</span>
      </button>
      {groups.length === 0 ? (
        <p className="sub">판단 근거를 고른 기록이 아직 없어요.</p>
      ) : (
        <div className="pie-detail-rows">
          {shown.map((g) => (
            <div key={g.group} className="pie-row">
              <PieChart slices={g.slices} size={64} />
              <div>
                <b className="chart-group">
                  {g.group} · {g.count}건
                </b>
                <PieLegend slices={g.slices} compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlanFollowCard({ trades }: { trades: Trade[] }) {
  const { total, withPlan, followed } = planFollowStats(trades);
  const denom = Math.max(1, total);
  return (
    <div className="card chart-card">
      <h2 className="chart-title">🎯 계획 이행 현황</h2>
      <PlanBar label={`전체 기록 · ${total}건`} pct={100} tone="default" />
      <PlanBar label={`계획이 있었던 기록 · ${withPlan}건`} pct={Math.round((withPlan / denom) * 100)} tone="default" />
      <PlanBar label={`계획대로 이행한 기록 · ${followed}건`} pct={Math.round((followed / denom) * 100)} tone="strong" />
    </div>
  );
}

function PlanBar({ label, pct, tone }: { label: string; pct: number; tone: "default" | "strong" }) {
  return (
    <div className="plan-bar">
      <div className="plan-bar-label">{label}</div>
      <div className="track">
        <i className={tone} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
    </div>
  );
}

function HBar({ rank, label, value, max, tone = "default" }: { rank: number; label: string; value: number; max: number; tone?: "default" | "strong" }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  const mark = ["①", "②", "③"][rank - 1] || String(rank);
  return (
    <div className="hbar-stack">
      <div className="hbar-top">
        {mark}{label}
      </div>
      <div className="hbar-bottom">
        <div className="track">
          <i className={tone} style={{ width: `${pct}%` }} />
        </div>
        <span>{value}건</span>
      </div>
    </div>
  );
}

function startOfWeek(base: Date) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function LineChart({ trades }: { trades: Trade[] }) {
  const [shift, setShift] = useState(0);
  const week = startOfWeek(new Date());
  week.setDate(week.getDate() - shift * 7);
  const slice = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(week.getDate() + i);
    return ymd(d);
  });
  const w = 320;
  const h = 140;
  const pad = 28;
  const max = Math.max(1, ...slice.map((d) => trades.filter((t) => t.tradedAt === d).length));
  function xy(d: string, i: number, side: Side) {
    const n = trades.filter((t) => t.tradedAt === d && t.side === side).length;
    const x = pad + (i * (w - pad * 2)) / 6;
    const y = h - pad - (n / max) * (h - pad * 2);
    return { x, y, n };
  }
  function pts(side: Side) {
    return slice.map((d, i) => {
      const p = xy(d, i, side);
      return `${p.x},${p.y}`;
    }).join(" ");
  }
  const from = slice[0]?.slice(5).replace("-", ".") || "";
  const to = slice[slice.length - 1]?.slice(5).replace("-", ".") || "";
  const range = `${from} ~ ${to}`;
  const ticks = max <= 2 ? [0, max] : [0, Math.round(max / 2), max];
  const dated = trades.map((t) => t.tradedAt).filter(Boolean).sort();
  const first = dated[0];
  const last = dated[dated.length - 1];
  const weekStart = slice[0];
  const weekEnd = slice[slice.length - 1];
  const canPrev = Boolean(first && weekStart && first < weekStart);
  const canNext = shift > 0;
  const singleWeek = Boolean(first && last && weekStart && weekEnd && first >= weekStart && last <= weekEnd && shift === 0);
  const showNav = !singleWeek && (canPrev || canNext);
  return (
    <>
      <div className="chart-nav">
        <div className="legend">
          <span className="buy"><i />매수</span>
          <span className="sell"><i />매도</span>
        </div>
        <span className="chart-range">
          {showNav ? (
            <button type="button" disabled={!canPrev} onClick={() => setShift((s) => s + 1)}>
              ‹
            </button>
          ) : null}
          <b>{range || "매매일자"}</b>
          {showNav ? (
            <button type="button" disabled={!canNext} onClick={() => setShift((s) => Math.max(0, s - 1))}>
              ›
            </button>
          ) : null}
        </span>
      </div>
      {slice.length === 0 ? (
        <p className="sub">기록이 더 쌓이면 일자별 추이가 그려져요.</p>
      ) : (
        <svg className="chart" viewBox={`0 0 ${w} ${h}`}>
          {ticks.map((n) => {
            const y = h - pad - (n / max) * (h - pad * 2);
            return (
              <g key={n}>
                <line x1={pad} x2={w - 8} y1={y} y2={y} stroke="#EDF0F5" strokeWidth="1" />
                <text x={pad - 6} y={y + 3} textAnchor="end" fontSize="10" fill="#8594A9">
                  {n}
                </text>
              </g>
            );
          })}
            <>
              <polyline fill="none" stroke={CHART_BUY} strokeWidth="2" points={pts("buy")} />
              <polyline fill="none" stroke={CHART_SELL} strokeWidth="2" points={pts("sell")} />
              {slice.map((d, i) => {
                const buy = xy(d, i, "buy");
                const sell = xy(d, i, "sell");
                return (
                  <g key={d}>
                    <circle cx={buy.x} cy={buy.y} r="3" fill={CHART_BUY} />
                    <circle cx={sell.x} cy={sell.y} r="3" fill={CHART_SELL} />
                  </g>
                );
              })}
            </>
          {slice.map((d, i) => {
            const x = pad + (i * (w - pad * 2)) / 6;
            return (
              <text key={d} x={x} y={h - 6} textAnchor="middle" fontSize="10" fill="#8594A9">
                {d.slice(5).replace("-", ".")}
              </text>
            );
          })}
        </svg>
      )}
    </>
  );
}

