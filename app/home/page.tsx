"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LEGAL, PhoneShell, TabBar } from "@/components/ui";
import { formatPrice, initials, monthKey, sideLabel, thisMonth, weekDays } from "@/lib/format";
import { INSIGHT_THRESHOLD, insightHref, issuedInsights, summarizeInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { Trade } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, nickname, trades, logout, withdraw, loggedIn, insightCopy, seenInsightKeys } = useStore();
  const [day, setDay] = useState<string | null>(null);
  const [profile, setProfile] = useState(false);
  const real = trades.filter((t) => !t.isPractice);
  const insight = summarizeInsights(trades);
  const month = thisMonth();
  const monthTrades = real.filter((t) => monthKey(t.tradedAt) === month);
  const monthBuy = monthTrades.filter((t) => t.side === "buy").length;
  const monthSell = monthTrades.filter((t) => t.side === "sell").length;
  const days = useMemo(() => weekDays(), []);
  const marked = useMemo(() => new Set(real.map((t) => t.tradedAt)), [real]);
  const recent = (day ? real.filter((t) => t.tradedAt === day) : real).slice(0, 5);
  const issued = issuedInsights(trades).slice(0, 3);
  const unread = issued.some((c) => !seenInsightKeys.includes(c.key));

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="scroll tabbed">
        <div className="home-head">
          <button className="avatar lg" type="button" onClick={() => setProfile(true)} aria-label="프로필">
            {initials(nickname)}
          </button>
          <div className="home-hello">
            <div className="brand-kicker">패턴노트</div>
            <h1 className="hello">안녕하세요, {nickname}님</h1>
          </div>
          <button className="bell" type="button" onClick={() => router.push("/insights")} aria-label="인사이트">
            <BellIcon />
            {unread ? <i className="dot" /> : null}
          </button>
        </div>

        <div className="week" role="tablist" aria-label="이번 주">
          {days.map((d) => (
            <button
              key={d.key}
              type="button"
              className={`${day === d.key ? "on" : ""} ${d.today ? "today" : ""}`}
              onClick={() => setDay(day === d.key ? null : d.key)}
            >
              <span className="dow">{d.dow}</span>
              <span className="num">{d.date}</span>
              {marked.has(d.key) ? <i className="mark" /> : <i className="mark off" />}
            </button>
          ))}
        </div>

        {issued.length > 0 ? (
          <div className="insight-rail-wrap">
            <h2>새로 나온 인사이트</h2>
            <div className="insight-rail">
              {issued.map((c) => {
                const copy = insightCopy[c.key];
                return (
                  <button
                    key={c.key}
                    className="insight-tile"
                    type="button"
                    onClick={() => router.push(insightHref(c.key))}
                  >
                    <span className="when">{c.issuedOn}</span>
                    <p>{copy?.interpretation ?? c.interpretation}</p>
                    <span className="meta">
                      최근 {c.total}건 중 {c.count}건
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <ProgressWide side="buy" count={insight.buyCount} remain={insight.buyRemaining} />
            <ProgressWide side="sell" count={insight.sellCount} remain={insight.sellRemaining} />
          </>
        )}

        <div className="month-card">
          <div>
            <div className="label">이번 달 기록</div>
            <div className="num">{monthTrades.length}건</div>
            <div className="split">
              매수 {monthBuy} · 매도 {monthSell}
            </div>
          </div>
          {monthTrades.length > 0 ? <MonthSpark trades={monthTrades} /> : null}
        </div>

        <div className="cta-grid">
          <button className="cta" type="button" onClick={() => router.push("/record")}>
            <span className="emo">✍️</span>
            <span>매매 기록하기</span>
          </button>
          <button className="cta" type="button" onClick={() => router.push("/plan/new")}>
            <span className="emo">🎯</span>
            <span>계획 등록하기</span>
          </button>
        </div>

        <div className="section-head">
          <h2>최근 기록</h2>
          <Link href="/records">전체보기</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty compact">
            <h3>{day ? "이날 남긴 기록이 없어요" : "아직 실제 기록이 없어요"}</h3>
            <p>{day ? "다른 날짜를 눌러 보거나 기록을 남겨 보세요." : "방금 매매한 종목을 남겨 보세요."}</p>
          </div>
        ) : (
          recent.map((t) => <TradeRow key={t.id} trade={t} onClick={() => router.push(`/records/${t.id}`)} />)
        )}
        <p className="legal">{LEGAL}</p>
      </div>
      <TabBar />
      {profile ? (
        <div className="modal-back" onClick={() => setProfile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{nickname}님</h3>
            <p>계정과 기록을 관리할 수 있어요.</p>
            {loggedIn ? (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ marginBottom: 8 }}
                  onClick={() => {
                    setProfile(false);
                    logout();
                    router.push("/login");
                  }}
                >
                  로그아웃
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    withdraw();
                    setProfile(false);
                    router.replace("/onboarding");
                  }}
                >
                  탈퇴
                </button>
              </>
            ) : (
              <button className="btn btn-primary" type="button" onClick={() => router.push("/login")}>
                로그인
              </button>
            )}
          </div>
        </div>
      ) : null}
    </PhoneShell>
  );
}

function ProgressWide({ side, count, remain }: { side: "buy" | "sell"; count: number; remain: number }) {
  const pct = Math.min(100, (count / INSIGHT_THRESHOLD) * 100);
  return (
    <div className={`progress-wide ${side}`}>
      <div className="pw-top">
        <b>{side === "buy" ? "오늘의 매수" : "오늘의 매도"}</b>
        <span>
          {Math.min(count, INSIGHT_THRESHOLD)}/{INSIGHT_THRESHOLD}
        </span>
      </div>
      <p>
        {remain === 0 ? "인사이트 카드를 확인할 수 있어요" : `인사이트 카드 발행까지 ${remain}건 남아 있어요`}
      </p>
      <div className="bar">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function TradeRow({ trade, onClick }: { trade: Trade; onClick: () => void }) {
  return (
    <button className="trade-row" type="button" onClick={onClick}>
      <div className={`avatar ${trade.side}`}>{initials(trade.stockName)}</div>
      <div>
        <div className="name">{trade.stockName}</div>
        <div className={trade.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(trade.side)}</div>
      </div>
      <div className="right">
        <div className="price">{formatPrice(trade.price, trade.market)}</div>
        {trade.reasons[0] ? <div className="meta">{trade.reasons[0].label}</div> : null}
      </div>
      <span className="chev">›</span>
    </button>
  );
}

function MonthSpark({ trades }: { trades: Trade[] }) {
  const days = weekDays();
  const h = 44;
  const w = 88;
  const counts = days.map((d) => trades.filter((t) => t.tradedAt === d.key).length);
  const max = Math.max(1, ...counts);
  const pts = counts
    .map((n, i) => {
      const x = 4 + (i * (w - 8)) / Math.max(1, counts.length - 1);
      const y = h - 6 - (n / max) * (h - 12);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg className="month-spark" viewBox={`0 0 ${w} ${h}`} width="88" height="44" aria-hidden>
      <polyline fill="none" stroke="#3d6bff" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" points={pts} />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
