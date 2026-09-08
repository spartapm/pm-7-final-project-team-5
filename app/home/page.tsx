"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark, FolderIco, PencilIco, ProgressRing } from "@/components/icons";
import { TradeRow } from "@/components/TradeRow";
import { LegalFooter, PhoneShell, TabBar } from "@/components/ui";
import { thisMonth } from "@/lib/format";
import { dateHref } from "@/lib/insights";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, nickname, trades, logout, withdraw, loggedIn, issuedCards } = useStore();
  const [profile, setProfile] = useState(false);
  const real = trades.filter((t) => !t.isPractice);
  const month = thisMonth();
  const monthTrades = real.filter((t) => new Date(t.createdAt).toISOString().slice(0, 7) === month);
  const monthBuy = monthTrades.filter((t) => t.side === "buy").length;
  const monthSell = monthTrades.filter((t) => t.side === "sell").length;
  const recent = [...real].sort((a, b) => (a.tradedAt < b.tradedAt ? 1 : -1)).slice(0, 5);
  const issued = [...issuedCards].sort((a, b) => b.issuedAt - a.issuedAt).slice(0, 3);
  const buyCount = real.filter((t) => t.side === "buy").length;
  const sellCount = real.filter((t) => t.side === "sell").length;

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="scroll tabbed">
        <div className="home-head">
          <button className="brand-btn" type="button" onClick={() => setProfile(true)} aria-label="프로필">
            <BrandMark size={40} />
          </button>
          <div className="home-hello">
            <div className="brand-kicker">패턴노트</div>
            <h1 className="hello">안녕하세요, {nickname}님</h1>
          </div>
        </div>

        {issued.length > 0 ? (
          <div className="insight-rail-wrap">
            <h2>새로 나온 인사이트</h2>
            <div className="insight-rail">
              {issued.map((c) => (
                <button key={c.id} className="insight-tile" type="button" onClick={() => router.push(dateHref(c.dateKey))}>
                  <span className="when">{c.dateKey.slice(5).replace("-", ".")}</span>
                  <p>{c.narrative2}</p>
                  <span className="meta">
                    최근 {c.windowSize}건 중 {c.count}건
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="progress-rail">
            <ProgressRing side="buy" count={buyCount} remain={Math.max(0, 3 - buyCount)} stalled={buyCount >= 3} />
            <ProgressRing side="sell" count={sellCount} remain={Math.max(0, 3 - sellCount)} stalled={sellCount >= 3} />
          </div>
        )}

        <div className="month-card">
          <div>
            <div className="label">이번 달 기록</div>
            <div className="num">{monthTrades.length}건</div>
            <div className="split">
              매수 {monthBuy} · 매도 {monthSell}
            </div>
          </div>
          <div className="month-side">
            <Link href="/insights">인사이트 보기 →</Link>
          </div>
        </div>

        <div className="cta-grid">
          <button className="cta" type="button" onClick={() => router.push("/record")}>
            <span className="cta-ico pencil">
              <PencilIco />
            </span>
            <span>매매 기록하기</span>
          </button>
          <button className="cta" type="button" onClick={() => router.push("/plan/new")}>
            <span className="cta-ico plan">
              <FolderIco />
            </span>
            <span>계획 등록하기</span>
          </button>
        </div>

        <div className="section-head">
          <h2>최근 기록</h2>
          <Link href="/records">전체보기</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty compact">
            <h3>아직 실제 기록이 없어요</h3>
            <p>방금 매매한 종목을 남겨 보세요.</p>
          </div>
        ) : (
          recent.map((t) => <TradeRow key={t.id} trade={t} blurMoney onClick={() => router.push(`/records/${t.id}`)} />)
        )}
        <LegalFooter />
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
