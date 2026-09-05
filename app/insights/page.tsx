"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { LEGAL, PhoneShell, TabBar } from "@/components/ui";
import { INSIGHT_THRESHOLD, insightHref, moodDistribution, reasonDistribution, summarizeInsights } from "@/lib/insights";
import { sideLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

const PIE = ["#1b2d4f", "#3d6bff", "#7aa0ff", "#b7ccff", "#d9e4ff"];

export default function InsightsPage() {
  const { hydrated, trades, plans, insightCopy, setInsightCopy } = useStore();
  const [tab, setTab] = useState<"dash" | "trend">("dash");
  const summary = useMemo(() => summarizeInsights(trades), [trades]);
  const real = summary.realTrades;
  const reasons = reasonDistribution(real);
  const moods = moodDistribution(real);
  const combosReady = summary.combos.filter((c) => c.count >= INSIGHT_THRESHOLD);
  const asked = useRef(new Set<string>());

  useEffect(() => {
    for (const c of combosReady) {
      if (insightCopy[c.key] || asked.current.has(c.key)) continue;
      asked.current.add(c.key);
      void fetch("/api/insight-copy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ side: c.side, reason: c.reason, mood: c.mood, count: c.count }),
      })
        .then((r) => r.json())
        .then((data: { observation?: string; interpretation?: string }) => {
          if (data.observation && data.interpretation) {
            setInsightCopy(c.key, { observation: data.observation, interpretation: data.interpretation });
          }
        })
        .catch(() => {
          asked.current.delete(c.key);
        });
    }
  }, [combosReady, insightCopy, setInsightCopy]);
  const withPlan = real.filter((t) => t.planId).length;
  const followed = real.filter((t) => {
    if (!t.planId) return false;
    const plan = plans.find((p) => p.id === t.planId);
    if (!plan) return false;
    if (t.side === "buy" && plan.targetBuy != null) return Math.abs(t.price - plan.targetBuy) / plan.targetBuy <= 0.03;
    if (t.side === "sell" && plan.takeProfit != null) return t.price >= plan.takeProfit;
    if (t.side === "sell" && plan.stopLoss != null) return t.price <= plan.stopLoss;
    return false;
  }).length;

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="scroll tabbed">
        <div className="brand-kicker">인사이트</div>
        <h1 className="hello">나의 기록 통계</h1>
        <p className="sub">전체 매매 기록을 기준으로 정리했어요</p>

        <div className="tabs">
          <button type="button" className={tab === "dash" ? "on" : ""} onClick={() => setTab("dash")}>대시보드</button>
          <button type="button" className={tab === "trend" ? "on" : ""} onClick={() => setTab("trend")}>
            경향해석
            {combosReady.length > 0 ? <i className="dot" /> : null}
          </button>
        </div>

        {tab === "dash" ? (
          <>
            <div className="card">
              <div className="stat-num">{real.length}건</div>
              <div className="sub">지금까지 기록한 매매</div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: 13 }}>
                매수 {summary.buyCount}건 · 매도 {summary.sellCount}건
              </div>
            </div>

            <div className="card">
              <div className="section-head" style={{ margin: "0 0 8px" }}>
                <h2>📈 매매 추이 · 매매유형별</h2>
              </div>
              <div className="legend">
                <span className="buy"><i />매수</span>
                <span className="sell"><i />매도</span>
              </div>
              <LineChart trades={real} />
            </div>

            <div className="card">
              <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>🎯 계획 이행 현황</h2>
              <HBar label="전체 기록" value={real.length} max={Math.max(real.length, 1)} />
              <HBar label="계획이 있었던 기록" value={withPlan} max={Math.max(real.length, 1)} />
              <HBar label="계획대로 이행한 기록" value={followed} max={Math.max(real.length, 1)} />
            </div>

            <div className="card">
              <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>📊 판단 이유 한눈에 보기</h2>
              {reasons.length === 0 ? <p className="sub">판단 근거를 고른 기록이 아직 없어요.</p> : (
                <div className="pie-wrap">
                  <Pie slices={reasons} />
                  <div className="pie-legend">
                    {reasons.slice(0, 5).map(([name, n], i) => (
                      <div key={name}>
                        <i className="swatch" style={{ background: PIE[i % PIE.length] }} />
                        {name} {n}건
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {moods.length > 0 && (
              <div className="card">
                <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>당시 상태 분포</h2>
                {moods.slice(0, 5).map(([name, n]) => (
                  <HBar key={name} label={name} value={n} max={moods[0]![1]} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {combosReady.length === 0 ? (
              <div className="card">
                <h3>아직 반복 패턴 카드가 없어요</h3>
                <p className="sub">
                  같은 판단 근거와 당시 상태가 {INSIGHT_THRESHOLD}건 모이면 관찰·해석 문장으로 보여 드려요.
                  매수 {summary.buyCount}/{INSIGHT_THRESHOLD} · 매도 {summary.sellCount}/{INSIGHT_THRESHOLD}
                </p>
              </div>
            ) : (
              combosReady.map((c) => {
                const copy = insightCopy[c.key];
                return (
                <Link className="card insight-card insight-link" key={c.key} href={insightHref(c.key)}>
                  <span className="badge">{sideLabel(c.side)} · {c.count}건 반복</span>
                  <h3>{copy?.observation ?? c.observation}</h3>
                  <p>{copy?.interpretation ?? c.interpretation}</p>
                  <span className="sub">관련 기록 {c.count}건 보기 ›</span>
                </Link>
                );
              })
            )}
            {summary.combos.filter((c) => c.count < INSIGHT_THRESHOLD).slice(0, 3).map((c) => (
              <div className="card insight-card" key={c.key}>
                <span className="badge">{sideLabel(c.side)} · {c.count}/{INSIGHT_THRESHOLD}</span>
                <h3>{c.reason}</h3>
                <p>{c.mood} 조합이 {INSIGHT_THRESHOLD - c.count}건 더 쌓이면 카드가 발행돼요.</p>
              </div>
            ))}
          </>
        )}
        <p className="legal">{LEGAL}</p>
      </div>
      <TabBar />
    </PhoneShell>
  );
}

function HBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="hbar">
      <span>{label}</span>
      <div className="track"><i style={{ width: `${pct}%` }} /></div>
      <b>{value}건</b>
    </div>
  );
}

function LineChart({ trades }: { trades: { tradedAt: string; side: "buy" | "sell" }[] }) {
  const days = [...new Set(trades.map((t) => t.tradedAt))].sort().slice(-8);
  if (days.length < 2) {
    return <p className="sub" style={{ marginTop: 12 }}>기록이 더 쌓이면 일자별 추이가 그려져요.</p>;
  }
  const w = 320;
  const h = 140;
  const pad = 24;
  const max = Math.max(
    1,
    ...days.map((d) => trades.filter((t) => t.tradedAt === d).length)
  );
  function pts(side: "buy" | "sell") {
    return days
      .map((d, i) => {
        const n = trades.filter((t) => t.tradedAt === d && t.side === side).length;
        const x = pad + (i * (w - pad * 2)) / (days.length - 1);
        const y = h - pad - (n / max) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke="#3d6bff" strokeWidth="2.5" points={pts("buy")} />
      <polyline fill="none" stroke="#f07a3a" strokeWidth="2.5" points={pts("sell")} />
      {days.map((d, i) => {
        const x = pad + (i * (w - pad * 2)) / (days.length - 1);
        return (
          <text key={d} x={x} y={h - 6} textAnchor="middle" fontSize="9" fill="#8b93a7">
            {d.slice(5).replace("-", ".")}
          </text>
        );
      })}
    </svg>
  );
}

function Pie({ slices }: { slices: [string, number][] }) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  let acc = 0;
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <g transform="translate(60,60) rotate(-90)">
        {slices.slice(0, 5).map(([, n], i) => {
          const dash = (n / total) * c;
          const gap = c - dash;
          const offset = -acc;
          acc += dash;
          return (
            <circle
              key={i}
              r={r}
              fill="none"
              stroke={PIE[i % PIE.length]}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </g>
    </svg>
  );
}
