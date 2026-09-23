"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/icons";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { TradeRow } from "@/components/TradeRow";
import { LegalFooter, Modal, PhoneShell, TabBar } from "@/components/ui";
import { thisMonth } from "@/lib/format";
import { comboTop3 } from "@/lib/insights";
import { planFollowStats } from "@/lib/plans";
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
  const follow = planFollowStats(trades);
  const topCombo = comboTop3(trades)[0];
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
        {loggedIn ? <h1 className="hello">안녕하세요, {nickname}님</h1> : null}

        <div className="month-card summary-card">
          <div className="month-card-head">
            <div className="label">나의 매매 요약</div>
            <Link href="/insights">인사이트 보기 →</Link>
          </div>
          <div className="summary-metrics">
            <div>
              <div className="label">총 기록</div>
              <div className="num">{real.length}건</div>
            </div>
            <div>
              <div className="label">계획 이행률</div>
              <div className="num">{follow.rate}%</div>
            </div>
            <div>
              <div className="label">이번 달 기록</div>
              <div className="num">{monthTrades.length}건</div>
            </div>
          </div>
          <div className="summary-combo">
            <div>
              <div className="label">최다 매매 이유 조합</div>
              <div className="combo-name">{topCombo ? topCombo[0] : "아직 기록한 매매가 없어요"}</div>
            </div>
            <div className="num">{topCombo ? `${topCombo[1]}건` : "0건"}</div>
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
