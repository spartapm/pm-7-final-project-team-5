"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InsightCard } from "@/components/InsightCard";
import { LegalFooter, PhoneShell, TabBar } from "@/components/ui";
import { reasonGroups } from "@/lib/categories";
import { comboTop3, dateHref, groupedIssued, moodDistribution, reasonDistribution, reasonSubDistribution, sideTrades } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { IssuedCard, Side, Trade } from "@/lib/types";

const PIE = ["#1b2d4f", "#3d6bff", "#7aa0ff", "#b7ccff", "#d9e4ff"];
const EXAMPLES = [
  { title: "매매추이", hint: "날짜별 매수·매도 건수가 여기에 그려져요" },
  { title: "판단 이유", hint: "무엇을 보고 결정했는지 분포가 보여요" },
  { title: "당시 마음", hint: "매수·매도 당시 상태가 나란히 보여요" },
  { title: "계획 이행", hint: "계획 구간과 실제 체결을 대조해요" },
  { title: "자주 겹치는 조합", hint: "이유와 마음이 같이 나온 조합 TOP3" },
];

export default function InsightsPage() {
  const router = useRouter();
  const { hydrated, trades, issuedCards, markCardsRead } = useStore();
  const [tab, setTab] = useState<"dash" | "trend">("dash");
  const [ex, setEx] = useState(0);
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
            <EmptyDash ex={ex} setEx={setEx} onRecord={() => router.push("/record")} />
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

function EmptyDash({ ex, setEx, onRecord }: { ex: number; setEx: (n: number) => void; onRecord: () => void }) {
  const rail = useRef<HTMLDivElement>(null);

  function go(i: number) {
    setEx(i);
    const card = rail.current?.children[i] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function onScroll() {
    const el = rail.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const w = (card?.offsetWidth || 1) + 10;
    const i = Math.round(el.scrollLeft / w);
    setEx(Math.max(0, Math.min(EXAMPLES.length - 1, i)));
  }

  return (
    <>
      <h3>아직 기록이 없어요</h3>
      <p className="sub">매매를 기록하면 나만의 통계가 이렇게 채워져요</p>
      <div className="example-rail" ref={rail} onScroll={onScroll}>
        {EXAMPLES.map((item, i) => (
          <div key={item.title} className={`card example-card ${i === ex ? "on" : ""}`}>
            <span className="ex-badge">예시</span>
            <b>{item.title}</b>
            <p className="sub">{item.hint}</p>
          </div>
        ))}
      </div>
      <div className="dots">
        {EXAMPLES.map((_, i) => (
          <i key={i} className={i === ex ? "on" : ""} onClick={() => go(i)} />
        ))}
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
        <p className="sub">기록 3개가 쌓일 때마다 반복된 판단을 카드로 보여 드려요. 매수와 매도는 따로 집계돼요.</p>
      </div>
      {groups.map(([date, cards]) => {
        const buy = cards.filter((c) => c.side === "buy").sort((a, b) => b.issuedAt - a.issuedAt)[0];
        const sell = cards.filter((c) => c.side === "sell").sort((a, b) => b.issuedAt - a.issuedAt)[0];
        const shown = [buy, sell].filter(Boolean) as IssuedCard[];
        return (
          <div className="date-group" key={date}>
            <div className="date-group-h">
              <b>{date.slice(5).replace("-", ".")}</b>
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
      <div className="card">
        <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>매매 추이</h2>
        <LineChart trades={real} />
      </div>
      <div className="card">
        <ReasonToggle real={real} reasons={reasons} />
      </div>
      <div className="card">
        <h2 style={{ margin: "0 0 12px", fontSize: 16 }}>매매 당시 마음 상태</h2>
        <div className="pie-pair">
          <div>
            <b>매수</b>
            <Pie slices={buyMoods} emptyLabel="아직 기록 없음" />
          </div>
          <div>
            <b>매도</b>
            <Pie slices={sellMoods} emptyLabel="아직 기록 없음" />
          </div>
        </div>
      </div>
      <div className="card">
        <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>자주 겹치는 조합 TOP3</h2>
        {top3.length === 0 ? <p className="sub">조합이 아직 없어요.</p> : top3.map(([name, n]) => (
          <HBar key={name} label={name} value={n} max={top3[0]![1]} />
        ))}
      </div>
    </>
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

function LineChart({ trades }: { trades: Trade[] }) {
  const days = [...new Set(trades.map((t) => t.tradedAt))].sort();
  const [page, setPage] = useState(Math.max(0, Math.ceil(days.length / 5) - 1));
  const pages = Math.max(1, Math.ceil(days.length / 5));
  const slice = days.slice(page * 5, page * 5 + 5);
  const w = 320;
  const h = 140;
  const pad = 24;
  const max = Math.max(1, ...slice.map((d) => trades.filter((t) => t.tradedAt === d).length));
  function pts(side: Side) {
    if (slice.length === 0) return "";
    return slice
      .map((d, i) => {
        const n = trades.filter((t) => t.tradedAt === d && t.side === side).length;
        const x = pad + (i * (w - pad * 2)) / Math.max(1, slice.length - 1);
        const y = h - pad - (n / max) * (h - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
  }
  const from = slice[0]?.slice(5).replace("-", ".") || "";
  const to = slice[slice.length - 1]?.slice(5).replace("-", ".") || "";
  return (
    <>
      <div className="section-head">
        <span className="sub">{from}~{to}</span>
        {days.length >= 5 ? (
          <span>
            <button type="button" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>‹</button>
            <button type="button" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>›</button>
          </span>
        ) : null}
      </div>
      <div className="legend">
        <span className="buy"><i />매수</span>
        <span className="sell"><i />매도</span>
      </div>
      {slice.length === 0 ? <p className="sub">기록이 더 쌓이면 일자별 추이가 그려져요.</p> : (
        <svg className="chart" viewBox={`0 0 ${w} ${h}`}>
          <polyline fill="none" stroke="#3d6bff" strokeWidth="2.5" points={pts("buy")} />
          <polyline fill="none" stroke="#f07a3a" strokeWidth="2.5" points={pts("sell")} />
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
                <Pie slices={slices} />
              </div>
              <Legend slices={slices} />
            </div>
          );
        })
      ) : (
        <div className="pie-wrap">
          <Pie slices={reasons} />
          <Legend slices={reasons} />
        </div>
      )}
    </>
  );
}

function Legend({ slices }: { slices: [string, number][] }) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  return (
    <div className="pie-legend">
      {slices.slice(0, 5).map(([name, n], i) => (
        <div key={name}>
          <i className="swatch" style={{ background: PIE[i % PIE.length] }} />
          {name} {n}건 ({Math.round((n / total) * 100)}%)
        </div>
      ))}
    </div>
  );
}

function Pie({ slices, emptyLabel }: { slices: [string, number][]; emptyLabel?: string }) {
  const total = slices.reduce((s, x) => s + x[1], 0) || 1;
  let acc = 0;
  const r = 36;
  const c = 2 * Math.PI * r;
  if (!slices.length) {
    return (
      <div className="pie-empty">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="36" fill="none" stroke="#e7ebf3" strokeWidth="16" />
        </svg>
        <p className="sub">{emptyLabel || "아직 기록 없음"}</p>
      </div>
    );
  }
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <g transform="translate(48,48) rotate(-90)">
        {slices.slice(0, 5).map(([, n], i) => {
          const dash = (n / total) * c;
          const gap = c - dash;
          const offset = -acc;
          acc += dash;
          return <circle key={i} r={r} fill="none" stroke={PIE[i % PIE.length]} strokeWidth="16" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} />;
        })}
      </g>
    </svg>
  );
}
