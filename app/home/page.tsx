"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/icons";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { TradeRow } from "@/components/TradeRow";
import { LegalFooter, Modal, PhoneShell, TabBar } from "@/components/ui";
import { thisMonth } from "@/lib/format";
import { startPlanSession, startRecordSession, track } from "@/lib/analytics";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const { hydrated, nickname, trades, logout, withdraw, loggedIn } = useStore();
  const [profile, setProfile] = useState(false);
  const [askWithdraw, setAskWithdraw] = useState(false);
  const real = trades.filter((t) => !t.isPractice);
  const month = thisMonth();
  const monthTrades = real.filter((t) => t.tradedAt.slice(0, 7) === month);
  const monthBuy = monthTrades.filter((t) => t.side === "buy").length;
  const monthSell = monthTrades.filter((t) => t.side === "sell").length;
  const recent = [...real]
    .sort((a, b) => (a.tradedAt === b.tradedAt ? b.createdAt - a.createdAt : a.tradedAt < b.tradedAt ? 1 : -1))
    .slice(0, 5);

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
        <h1 className="hello">{loggedIn ? `안녕하세요, ${nickname}님` : "안녕하세요"}</h1>

        <div className="month-card">
          <div>
            <div className="label">나의 매매 요약</div>
            <div className="num">{monthTrades.length}건</div>
            <div className="split">
              이번 달 매수 {monthBuy} · 매도 {monthSell}
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
      <OnboardingGuide />
      {profile ? (
        <div className="modal-back" onClick={() => setProfile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{loggedIn ? `${nickname}님` : "둘러보기"}</h3>
            <p>{loggedIn ? "계정과 기록을 관리할 수 있어요." : "로그인하면 기록을 저장할 수 있어요."}</p>
            {loggedIn ? (
              <>
                <button
                  className="btn btn-primary"
                  type="button"
                  style={{ marginBottom: 8 }}
                  onClick={() => {
                    setProfile(false);
                    logout();
                    router.push("/home");
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
            router.replace("/home");
          }}
        />
      ) : null}
    </PhoneShell>
  );
}
