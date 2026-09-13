"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InsightCard } from "@/components/InsightCard";
import { PieChart, PieLegend } from "@/components/PieChart";
import { LegalFooter, PhoneShell, TabBar } from "@/components/ui";
import { reasonGroups } from "@/lib/categories";
import { comboTop3, dateHref, groupedIssued, moodDistribution, reasonDistribution, reasonSubDistribution, sideTrades } from "@/lib/insights";
import { SAMPLE_INSIGHT } from "@/lib/onboarding-data";
import { buyCaption, sellCaption } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { IssuedCard, Side, Trade } from "@/lib/types";

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
          <Waiting buyCount={buyCount} sellCount={sellCount} onRecord={() => router.push("/record")} />
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
          <button className="btn btn-primary" type="button" onClick={() => router.push("/record")}>
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
  return (
    <>
      <h3>아직 기록이 없어요</h3>
      <p className="sub">매매를 기록하면 나만의 통계가 이렇게 채워져요</p>
      <div
        className="example-rail"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.78));
          setDot(Math.min(4, Math.max(0, i)));
        }}
      >
        <div className="example-card">
          <span className="ex-badge">예시</span>
          <b>매매 추이</b>
          <p className="sub">일자별 매수·매도 건수</p>
          <svg className="ex-line" viewBox="0 0 220 72" aria-hidden>
            <polyline fill="none" stroke="#476B9E" strokeWidth="2" points="8,48 52,28 96,36 140,16 204,24" />
            <polyline fill="none" stroke="#C99A3D" strokeWidth="2" points="8,56 52,52 96,44 140,32 204,20" />
            <circle cx="8" cy="48" r="2.5" fill="#476B9E" />
            <circle cx="52" cy="28" r="2.5" fill="#476B9E" />
            <circle cx="96" cy="36" r="2.5" fill="#476B9E" />
            <circle cx="140" cy="16" r="2.5" fill="#476B9E" />
            <circle cx="204" cy="24" r="2.5" fill="#476B9E" />
            <circle cx="8" cy="56" r="2.5" fill="#C99A3D" />
            <circle cx="52" cy="52" r="2.5" fill="#C99A3D" />
            <circle cx="96" cy="44" r="2.5" fill="#C99A3D" />
            <circle cx="140" cy="32" r="2.5" fill="#C99A3D" />
            <circle cx="204" cy="20" r="2.5" fill="#C99A3D" />
          </svg>
        </div>
        <div className="example-card">
          <span className="ex-badge">예시</span>
          <b>판단 근거</b>
          <p className="sub">자주 고른 근거 비중</p>
          <div className="ex-pie" />
        </div>
        <div className="example-card">
          <span className="ex-badge">예시</span>
          <b>계획 이행</b>
          <p className="sub">계획이 있었던 기록 비율</p>
          <div className="ex-plan">
            <span />
            <span style={{ width: "62%" }} />
            <span style={{ width: "38%" }} />
          </div>
        </div>
        <div className="example-card">
          <span className="ex-badge">예시</span>
          <b>매수 마음</b>
          <p className="sub">매수할 때 자주 고른 마음</p>
          <div className="ex-pie buy-mood" />
        </div>
        <div className="example-card">
          <span className="ex-badge">예시</span>
          <b>매도 마음</b>
          <p className="sub">매도할 때 자주 고른 마음</p>
          <div className="ex-pie sell-mood" />
        </div>
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
      <div className="card">
        <p className="sub">기록 3개가 쌓일 때마다 새 카드 발행을 시도해요</p>
        <p className="sub">뚜렷한 경향이 안 보이면 이번엔 카드가 발행되지 않을 수 있어요</p>
      </div>
      {groups.map(([date, cards]) => {
        const buy = cards.filter((c) => c.side === "buy").sort((a, b) => b.issuedAt - a.issuedAt)[0];
        const sell = cards.filter((c) => c.side === "sell").sort((a, b) => b.issuedAt - a.issuedAt)[0];
        const shown = [buy, sell].filter(Boolean) as IssuedCard[];
        return (
          <div className="date-group" key={date}>
            <div className="date-group-h">
              <b>{date} 발행</b>
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
            <PieChart slices={buyMoods} emptyLabel="아직 기록 없음" palette={BUY_PIE} size={96} />
            <PieLegend slices={buyMoods} palette={BUY_PIE} compact />
          </div>
          <div>
            <b className="chart-group">매도 · {sellCount}건</b>
            <PieChart slices={sellMoods} emptyLabel="아직 기록 없음" palette={SELL_PIE} size={96} />
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
        reasonGroups().map((g) => {
          const slices = reasonSubDistribution(real, g.group);
          if (!slices.length) return null;
          const count = slices.reduce((s, x) => s + x[1], 0);
          return (
            <div key={g.group} className="pie-block">
              <b className="chart-group">{g.group} · {count}건</b>
              <div className="pie-wrap compact">
                <PieChart slices={slices} size={88} />
                <PieLegend slices={slices} compact />
              </div>
            </div>
          );
        })
      ) : (
        <div className="pie-wrap overview">
          <PieChart slices={reasons} size={132} />
          <PieLegend slices={reasons} />
        </div>
      )}
    </>
  );
}

