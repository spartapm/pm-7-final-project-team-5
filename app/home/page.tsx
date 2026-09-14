"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark, ProgressRing } from "@/components/icons";
import { TradeRow } from "@/components/TradeRow";
import { LegalFooter, Modal, PhoneShell, TabBar } from "@/components/ui";
import { thisMonth } from "@/lib/format";
import { insightHref } from "@/lib/insights";
import { startPlanSession, startRecordSession, track } from "@/lib/analytics";
import { useStore } from "@/lib/store";

const COACH_KEY = "inplot:seen-coach";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, nickname, trades, logout, withdraw, loggedIn, issuedCards } = useStore();
  const [profile, setProfile] = useState(false);
  const [askWithdraw, setAskWithdraw] = useState(false);
  const [coach, setCoach] = useState(false);
  const real = trades.filter((t) => !t.isPractice);
  const month = thisMonth();
  const monthTrades = real.filter((t) => t.tradedAt.slice(0, 7) === month);
  const monthBuy = monthTrades.filter((t) => t.side === "buy").length;
  const monthSell = monthTrades.filter((t) => t.side === "sell").length;
  const recent = [...real]
    .sort((a, b) => (a.tradedAt === b.tradedAt ? b.createdAt - a.createdAt : a.tradedAt < b.tradedAt ? 1 : -1))
    .slice(0, 5);
  const issued = [...issuedCards].sort((a, b) => b.issuedAt - a.issuedAt).slice(0, 3);
  const buyCount = real.filter((t) => t.side === "buy").length;
  const sellCount = real.filter((t) => t.side === "sell").length;

  useEffect(() => {
    if (!hydrated) return;
    if (localStorage.getItem(COACH_KEY)) return;
    setCoach(true);
  }, [hydrated]);

  function dismissCoach() {
    localStorage.setItem(COACH_KEY, "1");
    setCoach(false);
  }

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="scroll tabbed">
        <div className="home-head">
          <button className="brand-btn" type="button" onClick={() => setProfile(true)} aria-label="프로필">
            <BrandMark size={22} />
          </button>
          <div className="brand-kicker">인플롯</div>
        </div>
        <h1 className="hello">안녕하세요, {nickname}님</h1>

        {issued.length > 0 ? (
          <div className="insight-rail-wrap">
            <h2>새로 나온 인사이트</h2>
            <div className="insight-rail">
              {issued.map((c) => (
                <button key={c.id} className="insight-tile" type="button" onClick={() => router.push(insightHref(c.id))}>
                  <span className="when">{c.dateKey.slice(5).replace("-", ".")}</span>
                  <p>{c.narrative2}</p>
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
          <button className="cta" type="button" onClick={() => {
            startRecordSession("home", real.length);
            router.push("/record");
          }}>
            <span className="cta-emoji" aria-hidden>
              ✍️
            </span>
            <span className="cta-label">매매 기록하기</span>
          </button>
          <button className="cta" type="button" onClick={() => {
            startPlanSession("home");
            router.push("/plan/new");
          }}>
            <span className="cta-emoji" aria-hidden>
              🎯
            </span>
            <span className="cta-label">계획 등록하기</span>
          </button>
        </div>

        <div className="section-head home-records">
          <h2>최근 기록</h2>
          <Link href="/records">전체보기</Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty compact">
            <h3>아직 실제 기록이 없어요</h3>
            <p>방금 매매한 종목을 남겨 보세요.</p>
          </div>
        ) : (
          recent.map((t, i) => (
            <TradeRow
              key={t.id}
              trade={t}
              blurMoney
              onClick={() => {
                track("record_item_click", {
                  row_index: i,
                  entry_source: "record_list",
                  screen_name: "home",
                });
                router.push(`/records/${t.id}?src=record_list`);
              }}
            />
          ))
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
                    setProfile(false);
                    setAskWithdraw(true);
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
      {askWithdraw ? (
        <Modal
          title="정말 탈퇴하시겠어요?"
          body="탈퇴 시 계정 정보와 모든 매매 계획과 기록이 삭제되며 재가입하더라도 복구할 수 없어요."
          cancel="아니요"
          confirm="네"
          split
          onCancel={() => setAskWithdraw(false)}
          onConfirm={() => {
            withdraw();
            setAskWithdraw(false);
            setProfile(false);
            router.replace("/onboarding");
          }}
        />
      ) : null}
      {coach ? (
        <div className="modal-back" onClick={dismissCoach}>
          <div className="modal coach-sheet" onClick={(e) => e.stopPropagation()}>
            <h3>메뉴를 이렇게 써 보세요</h3>
            <p>온보딩이 끝나면 아래 탭으로 바로 이동할 수 있어요.</p>
            <ul className="coach-list">
              <li>
                <b>홈</b>
                <span>이번 달 기록과 새로 나온 인사이트</span>
              </li>
              <li>
                <b>계획</b>
                <span>희망 매수가 · 목표가 · 손절가</span>
              </li>
              <li>
                <b>기록</b>
                <span>매수·매도를 남기고 다시 보기</span>
              </li>
              <li>
                <b>인사이트</b>
                <span>반복된 판단과 마음 상태 통계</span>
              </li>
            </ul>
            <button className="btn btn-primary" type="button" onClick={dismissCoach}>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </PhoneShell>
  );
}
