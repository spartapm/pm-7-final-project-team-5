"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InsightCard } from "@/components/InsightCard";
import { PieChart, PieLegend } from "@/components/PieChart";
import { LegalFooter, PhoneShell, TabBar } from "@/components/ui";
import { startRecordSession, track, trackOnce } from "@/lib/analytics";
import { reasonGroups } from "@/lib/categories";
import { comboTop3, dateHref, groupedIssued, moodDistribution, reasonDistribution, reasonSubDistribution, sideTrades } from "@/lib/insights";
import { todayKey } from "@/lib/format";
import { SAMPLE_INSIGHT } from "@/lib/onboarding-data";
import { buyCaption, sellCaption } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { IssuedCard, Side, Trade } from "@/lib/types";

const EMPTY_PREVIEWS = [
  { src: "/figma/preview/trend.png", alt: "매매 추이 예시" },
  { src: "/figma/preview/plan.png", alt: "계획 이행 현황 예시" },
  { src: "/figma/preview/reason-overview.png", alt: "판단 이유 한눈에 보기 예시" },
  { src: "/figma/preview/reason-detail.png", alt: "판단 이유 자세히 보기 예시" },
  { src: "/figma/preview/combo.png", alt: "자주 겹치는 조합 TOP 3 예시" },
];
const BUY_PIE = ["#476B9E", "#6382AD", "#8098BC", "#9CAFCB", "#B8C5DA", "#D4DCE8", "#F0F2F7"];
const SELL_PIE = ["#C99A3D", "#D5AE60", "#DFC382", "#E9D6A6", "#F3E9CC"];
const CHART_BUY = "#476B9E";
const CHART_SELL = "#C99A3D";

export default function InsightsPage() {
  const router = useRouter();
  const { hydrated, trades, issuedCards, markCardsRead } = useStore();
  const [tab, setTab] = useState<"dash" | "trend">("dash");
  const real = trades.filter((t) => !t.isPractice);
  const buyCount = sideTrades(trades, "buy").length;
  const sellCount = sideTrades(trades, "sell").length;
  const reasons = reasonDistribution(real);
  const buyMoods = moodDistribution(real.filter((t) => t.side === "buy"));
  const sellMoods = moodDistribution(real.filter((t) => t.side === "sell"));
  const top3 = comboTop3(trades);
  const groups = groupedIssued(issuedCards);
  const hasCard = issuedCards.length > 0;
  const waiting = !hasCard && real.length > 0 && ((buyCount > 0 && buyCount < 3) || (sellCount > 0 && sellCount < 3));

  useEffect(() => {
    if (!hydrated || tab !== "dash") return;
    const dashboardState = real.length === 0 ? "empty" : hasCard ? "available" : "insufficient_records";
    trackOnce(`dashboard_view:${dashboardState}`, "dashboard_view", {
      dashboard_state: dashboardState,
      record_count: real.length,
      available_chart_ids: real.length === 0 ? [] : ["trade_trend", "plan_follow", "reason_pie", "mood_pie", "combo_top3"],
      insight_available: hasCard,
      screen_id: "4-1",
      screen_name: "insight_dashboard",
    });
  }, [hydrated, tab, real.length, hasCard]);

  if (!hydrated) return <div className="shell" />;

  function goTrend() {
    if (real.length === 0) return;
    setTab("trend");
    markCardsRead();
  }

  return (
    <PhoneShell>
      <div className="scroll tabbed">
        <div className="brand-kicker insight-kicker">인사이트</div>
        <h1 className="hello insight-hello">{tab === "dash" ? "나의 기록 통계" : "경향해석"}</h1>
        {tab === "dash" ? <p className="sub dash-lead">전체 매매 기록을 기준으로 정리했어요</p> : null}
        <div className="tabs">
          <button type="button" className={tab === "dash" ? "on" : ""} onClick={() => setTab("dash")}>
            대시보드
          </button>
          <button type="button" className={tab === "trend" ? "on" : ""} onClick={goTrend} disabled={real.length === 0} aria-disabled={real.length === 0}>
            경향해석
            {issuedCards.some((c) => !c.read) ? <i className="dot" /> : null}
          </button>
        </div>

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

        {tab === "dash" ? (
          real.length === 0 ? (
            <EmptyDash />
          ) : (
            <Dashboard
              real={real}
              buyCount={buyCount}
              sellCount={sellCount}
              reasons={reasons}
              buyMoods={buyMoods}
              sellMoods={sellMoods}
              top3={top3}
            />
          )
        ) : waiting ? (
          <Waiting
            buyCount={buyCount}
            sellCount={sellCount}
            onRecord={() => {
              startRecordSession("insight_waiting", real.length);
              router.push("/record");
            }}
          />
        ) : hasCard ? (
          <TrendList groups={groups} />
        ) : (
          <div className="card">
            <p className="sub">{SAMPLE_INSIGHT.policy}</p>
            <p className="sub">{SAMPLE_INSIGHT.policySub}</p>
          </div>
        )}
        <LegalFooter />
      </div>
      {tab === "dash" && real.length === 0 ? (
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

function Waiting({ buyCount, sellCount, onRecord }: { buyCount: number; sellCount: number; onRecord: () => void }) {
  return (
    <>
      <h2>{SAMPLE_INSIGHT.policy}</h2>
      <p className="sub">{SAMPLE_INSIGHT.policySub}</p>
      <SegBox label="매수" count={buyCount} />
      <SegBox label="매도" count={sellCount} />
      <button className="btn btn-primary" type="button" style={{ marginTop: 20 }} onClick={onRecord}>
        매매 기록하기
      </button>
    </>
  );
}

function SegBox({ label, count }: { label: string; count: number }) {
  const filled = Math.min(count, 3);
  return (
    <div className="card">
      <div className="section-head" style={{ margin: 0 }}>
        <h2>{label}</h2>
        <b>
          {Math.min(count, 3)}/3건
        </b>
      </div>
      <div className="seg-bar">
        {[0, 1, 2].map((i) => (
          <i key={i} className={i < filled ? "on" : ""} />
        ))}
      </div>
      <p className="sub">같은 유형 기록이 3건 모이면 카드가 발행돼요</p>
    </div>
  );
}

function TrendList({ groups }: { groups: [string, IssuedCard[]][] }) {
  return (
    <>
      <div className="insight-policy">
        <p className="policy-title">{SAMPLE_INSIGHT.policy}</p>
        <p className="policy-sub">{SAMPLE_INSIGHT.policySub}</p>
      </div>
      {groups.map(([date, cards]) => {
        const buy = cards.filter((c) => c.side === "buy").sort((a, b) => b.issuedAt - a.issuedAt)[0];
        const sell = cards.filter((c) => c.side === "sell").sort((a, b) => b.issuedAt - a.issuedAt)[0];
        const shown = [buy, sell].filter(Boolean) as IssuedCard[];
        return (
          <div className="date-group" key={date}>
            <div className="date-group-h">
              <b>{date === todayKey() ? "오늘 발행" : `${date} 발행`}</b>
              <a href={dateHref(date)}>이 날짜의 카드 전체보기</a>
            </div>
            {shown.map((c) => (
              <InsightCard key={c.id} card={c} />
            ))}
          </div>
        );
      })}
    </>
  );
}

function Dashboard({
  real,
  buyCount,
  sellCount,
  reasons,
  buyMoods,
  sellMoods,
  top3,
}: {
  real: Trade[];
  buyCount: number;
  sellCount: number;
  reasons: [string, number][];
  buyMoods: [string, number][];
  sellMoods: [string, number][];
  top3: [string, number][];
}) {
  return (
    <>
      <div className="card chart-card stat-card">
        <div className="stat-num">{real.length}건</div>
        <div className="sub">지금까지 기록한 매매</div>
        <div className="stat-split">매수 {buyCount}건 · 매도 {sellCount}건</div>
      </div>
      <div className="card chart-card">
        <h2 className="chart-title">📈 매매 추이 · 매매유형별 (일자별)</h2>
        <LineChart trades={real} />
      </div>
      <PlanFollowCard trades={real} />
      <div className="card chart-card">
        <ReasonToggle real={real} reasons={reasons} />
      </div>
      <div className="card chart-card">
        <h2 className="chart-title">🧭 매매 당시 마음 상태</h2>
        <div className="pie-pair">
          <div>
            <b className="chart-group">매수 · {buyCount}건</b>
            <PieChart slices={buyMoods} emptyLabel="아직 기록 없음" palette={BUY_PIE} size={64} />
            <PieLegend slices={buyMoods} palette={BUY_PIE} compact />
          </div>
          <div>
            <b className="chart-group">매도 · {sellCount}건</b>
            <PieChart slices={sellMoods} emptyLabel="아직 기록 없음" palette={SELL_PIE} size={64} />
            <PieLegend slices={sellMoods} palette={SELL_PIE} compact />
          </div>
        </div>
      </div>
      <div className="card chart-card">
        <h2 className="chart-title">🔗 자주 겹치는 조합 · TOP 3</h2>
        {top3.length === 0 ? <p className="sub">조합이 아직 없어요.</p> : top3.map(([name, n], i) => (
          <HBar key={name} rank={i + 1} label={name} value={n} max={top3[0]![1]} tone="default" />
        ))}
      </div>
    </>
  );
}

function PlanFollowCard({ trades }: { trades: Trade[] }) {
  const withPlan = trades.filter((t) => (t.side === "buy" ? t.planSnapshot?.buy : t.planSnapshot?.sell));
  const followed = withPlan.filter((t) =>
    t.side === "buy" && t.planSnapshot?.buy
      ? buyCaption(t.price, t.planSnapshot.buy.min, t.planSnapshot.buy.max).inRange
      : t.planSnapshot?.sell
        ? sellCaption(t.price, t.planSnapshot.sell.stopLoss, t.planSnapshot.sell.takeProfit).inRange
        : false
  );
  const total = Math.max(1, trades.length);
  return (
    <div className="card chart-card">
      <h2 className="chart-title">🎯 계획 이행 현황</h2>
      <PlanBar label={`전체 기록 · ${trades.length}건`} pct={100} tone="default" />
      <PlanBar label={`계획이 있었던 기록 · ${withPlan.length}건`} pct={Math.round((withPlan.length / total) * 100)} tone="default" />
      <PlanBar label={`계획대로 이행한 기록 · ${followed.length}건`} pct={Math.round((followed.length / total) * 100)} tone="strong" />
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

function LineChart({ trades }: { trades: Trade[] }) {
  const days = [...new Set(trades.map((t) => t.tradedAt))].sort();
  const [shift, setShift] = useState(0);
  const end = days.length - 1 - shift;
  const slice = days.slice(Math.max(0, end - 4), end + 1);
  const w = 320;
  const h = 140;
  const pad = 28;
  const max = Math.max(1, ...slice.map((d) => trades.filter((t) => t.tradedAt === d).length));
  function xy(d: string, i: number, side: Side) {
    const n = trades.filter((t) => t.tradedAt === d && t.side === side).length;
    const x = slice.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / Math.max(1, slice.length - 1);
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
  const range = from === to ? from : `${from} ~ ${to}`;
  const ticks = max <= 2 ? [0, max] : [0, Math.round(max / 2), max];
  return (
    <>
      <div className="chart-nav">
        <div className="legend">
          <span className="buy"><i />매수</span>
          <span className="sell"><i />매도</span>
        </div>
        <span className="chart-range">
          <button type="button" disabled={end <= 4} onClick={() => setShift((s) => s + 1)}>
            ‹
          </button>
          <b>{range || "매매일자"}</b>
          <button type="button" disabled={shift <= 0} onClick={() => setShift((s) => Math.max(0, s - 1))}>
            ›
          </button>
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
          {slice.length === 1 ? (
            <>
              <circle cx={xy(slice[0]!, 0, "buy").x} cy={xy(slice[0]!, 0, "buy").y} r="3" fill={CHART_BUY} />
              <circle cx={xy(slice[0]!, 0, "sell").x} cy={xy(slice[0]!, 0, "sell").y} r="3" fill={CHART_SELL} />
            </>
          ) : (
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
          )}
          {slice.map((d, i) => {
            const x = slice.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / Math.max(1, slice.length - 1);
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

function ReasonToggle({ real, reasons }: { real: Trade[]; reasons: [string, number][] }) {
  const [detail, setDetail] = useState(false);
  return (
    <>
      <div className="section-head" style={{ margin: "0 0 12px" }}>
        <h2 className="chart-title" style={{ margin: 0 }}>{detail ? "📊 판단 이유 자세히 보기" : "📊 판단 이유 한눈에 보기"}</h2>
        {reasons.length > 0 ? (
          <button className="chart-link" type="button" onClick={() => setDetail((v) => !v)}>
            {detail ? "한눈에 보기" : "자세히 보기"}
          </button>
        ) : null}
      </div>
      {reasons.length === 0 ? (
        <p className="sub">판단 근거를 고른 기록이 아직 없어요.</p>
      ) : detail ? (
        <div className="pie-detail">
          {reasonGroups()
            .map((g) => {
              const slices = reasonSubDistribution(real, g.group);
              if (!slices.length) return null;
              const count = slices.reduce((s, x) => s + x[1], 0);
              return { group: g.group, slices, count };
            })
            .filter((x): x is { group: string; slices: [string, number][]; count: number } => Boolean(x))
            .map((g, i) => (
              <div key={g.group} className={`pie-block ${i === 0 ? "lead" : ""}`}>
                <b className="chart-group">
                  {g.group} · {g.count}건
                </b>
                <div className={i === 0 ? "pie-wrap compact" : "pie-mini"}>
                  <PieChart slices={g.slices} size={i === 0 ? 90 : 56} />
                  <PieLegend slices={g.slices} compact />
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="pie-wrap overview">
          <PieChart slices={reasons} size={120} />
          <PieLegend slices={reasons} />
        </div>
      )}
    </>
  );
}

