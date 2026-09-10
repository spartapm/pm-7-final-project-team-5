"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InsightCard } from "@/components/InsightCard";
import { LegalFooter, PhoneShell, TabBar } from "@/components/ui";
import { reasonGroups } from "@/lib/categories";
import { comboTop3, dateHref, groupedIssued, moodDistribution, reasonDistribution, reasonSubDistribution, sideTrades } from "@/lib/insights";
import { buyCaption, sellCaption } from "@/lib/plans";
import { useStore } from "@/lib/store";
import type { IssuedCard, Side, Trade } from "@/lib/types";

const PIE = ["#252F4A", "#476B9E", "#738CAD", "#A6B8D1", "#D9E3F0", "#EEF2FA"];
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
        <div className="brand-kicker">인사이트</div>
        <h1 className="hello">{tab === "dash" ? "나의 기록 통계" : "경향해석"}</h1>
        <div className="tabs">
          <button type="button" className={tab === "dash" ? "on" : ""} onClick={() => setTab("dash")}>
            대시보드
          </button>
          <button type="button" className={tab === "trend" ? "on" : ""} onClick={goTrend}>
            경향해석
            {issuedCards.some((c) => !c.read) ? <i className="dot" /> : null}
          </button>
        </div>

        {tab === "dash" ? (
          real.length === 0 ? (
            <EmptyDash onRecord={() => router.push("/record")} />
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
            <p className="sub">매수·매도 판단은 각각 따로 집계돼요. 조건이 맞으면 카드가 발행돼요.</p>
          </div>
        )}
        <LegalFooter />
      </div>
      <TabBar />
    </PhoneShell>
  );
}

function EmptyDash({ onRecord }: { onRecord: () => void }) {
  return (
    <>
      <h3>아직 기록이 없어요</h3>
      <p className="sub">매매를 기록하면 나만의 통계가 이렇게 채워져요</p>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <img src="/brand/insight-report-sample.png" alt="인사이트 리포트 예시" className="example-report" width={375} height={1519} />
      </div>
      <button className="btn btn-primary" type="button" style={{ marginTop: 20 }} onClick={onRecord}>
        첫 매매 기록하기
      </button>
    </>
  );
}

function Waiting({ buyCount, sellCount, onRecord }: { buyCount: number; sellCount: number; onRecord: () => void }) {
  return (
    <>
      <h2>반복되는 판단을 보여드려요</h2>
      <p className="sub">매수·매도 판단은 각각 따로 집계돼요</p>
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
              <b>{date}</b>
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
      <div className="card">
        <div className="stat-num">{real.length}건</div>
        <div className="sub">지금까지 기록한 매매</div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: 13 }}>
          매수 {buyCount}건 · 매도 {sellCount}건
        </div>
      </div>
      <div className="card chart-card">
        <h2 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, lineHeight: "17px", color: "#191F28" }}>매매 추이</h2>
        <LineChart trades={real} />
      </div>
      <div className="card chart-card">
        <ReasonToggle real={real} reasons={reasons} />
      </div>
      <div className="card chart-card">
        <h2 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, lineHeight: "17px", color: "#191F28" }}>매매 당시 마음 상태</h2>
        <div className="pie-pair">
          <div>
            <b>매수</b>
            <Pie slices={buyMoods} emptyLabel="아직 기록 없음" palette={BUY_PIE} size={64} />
            <Legend slices={buyMoods} palette={BUY_PIE} />
          </div>
          <div>
            <b>매도</b>
            <Pie slices={sellMoods} emptyLabel="아직 기록 없음" palette={SELL_PIE} size={64} />
            <Legend slices={sellMoods} palette={SELL_PIE} />
          </div>
        </div>
      </div>
      <div className="card chart-card">
        <h2 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, lineHeight: "17px", color: "#191F28" }}>자주 겹치는 조합 TOP3</h2>
        {top3.length === 0 ? <p className="sub">조합이 아직 없어요.</p> : top3.map(([name, n], i) => (
          <HBar key={name} rank={i + 1} label={name} value={n} max={top3[0]![1]} />
        ))}
      </div>
      <PlanFollowCard trades={real} />
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
  return (
    <div className="card chart-card">
      <h2 style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, lineHeight: "17px", color: "#191F28" }}>계획 이행 현황</h2>
      <p>전체기록 {trades.length}건</p>
      <p className="sub">계획이 있었던 기록 {withPlan.length}건</p>
      <p className="sub">계획대로 이행한 기록 {followed.length}건</p>
    </div>
  );
}

function HBar({ rank, label, value, max }: { rank: number; label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="hbar-stack">
      <div className="hbar-top">
        {rank} {label}
      </div>
      <div className="hbar-bottom">
        <div className="track">
          <i style={{ width: `${pct}%` }} />
        </div>
        <b>{value}건</b>
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
    const x = pad + (i * (w - pad * 2)) / Math.max(1, slice.length - 1);
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
  const range = from === to ? from : `${from}~${to}`;
  return (
    <>
      <div className="section-head chart-nav">
        <span />
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
      <div className="legend">
        <span className="buy"><i />매수</span>
        <span className="sell"><i />매도</span>
      </div>
      {slice.length === 0 ? (
        <p className="sub">기록이 더 쌓이면 일자별 추이가 그려져요.</p>
      ) : (
        <svg className="chart" viewBox={`0 0 ${w} ${h}`}>
          {[0, 0.5, 1].map((t) => {
            const y = h - pad - t * (h - pad * 2);
            return <line key={t} x1={pad} x2={w - 8} y1={y} y2={y} stroke="#EDF0F5" strokeWidth="1" />;
          })}
          {slice.length === 1 ? (
            <>
              <circle cx={w / 2} cy={xy(slice[0]!, 0, "buy").y} r="3" fill={CHART_BUY} />
              <circle cx={w / 2} cy={xy(slice[0]!, 0, "sell").y} r="3" fill={CHART_SELL} />
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
            const x = pad + (i * (w - pad * 2)) / Math.max(1, slice.length - 1);
            return (
              <text key={d} x={x} y={h - 6} textAnchor="middle" fontSize="10" fill="#8594A9">
                {d.slice(5).replace("-", ".")}
              </text>
            );
          })}
          {[0, max].map((n) => (
            <text key={n} x="4" y={h - pad - (n / max) * (h - pad * 2) + 4} fontSize="10" fill="#8594A9">
              {n}
            </text>
          ))}
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
        <h2 style={{ margin: 0, fontSize: 16 }}>{detail ? "판단 이유 자세히 보기" : "판단 이유 한눈에 보기"}</h2>
        {reasons.length > 0 ? (
          <button className="skip" type="button" onClick={() => setDetail((v) => !v)}>
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
          return (
            <div key={g.group} className="pie-wrap" style={{ marginTop: 12 }}>
              <div>
                <b>{g.group}</b>
                <Pie slices={slices} size={56} />
              </div>
              <Legend slices={slices} />
            </div>
          );
        })
      ) : (
        <div className="pie-wrap">
          <Pie slices={reasons} size={120} />
          <Legend slices={reasons} />
        </div>
      )}
    </>
  );
}

function Legend({ slices, palette = PIE }: { slices: [string, number][]; palette?: string[] }) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  return (
    <div className="pie-legend">
      {slices.slice(0, 5).map(([name, n], i) => (
        <div key={name}>
          <i className="swatch" style={{ background: palette[i % palette.length] }} />
          <span style={{ color: "#191F28" }}>{name}</span>{" "}
          <span style={{ color: "#8594A9" }}>{n}건 ({Math.round((n / total) * 100)}%)</span>
        </div>
      ))}
    </div>
  );
}

function Pie({ slices, emptyLabel, palette = PIE, size = 96 }: { slices: [string, number][]; emptyLabel?: string; palette?: string[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  let acc = 0;
  const r = Math.round(size * 0.375);
  const stroke = Math.max(10, Math.round(size * 0.14));
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  if (!slices.length) {
    return (
      <div className="pie-empty">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="#EAEDF0" strokeWidth={stroke} />
        </svg>
        <p className="sub">{emptyLabel || "아직 기록 없음"}</p>
      </div>
    );
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${mid},${mid}) rotate(-90)`}>
        {slices.slice(0, 6).map(([, n], i) => {
          const dash = (n / total) * c;
          const gap = c - dash;
          const offset = -acc;
          acc += dash;
          return <circle key={i} r={r} fill="none" stroke={palette[i % palette.length]} strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="butt" />;
        })}
      </g>
    </svg>
  );
}
