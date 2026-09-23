"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

const STEPS = [
  {
    title: "내 매매 판단을 기록해보세요",
    body: "매수·매도 당시 어떤 이유로 판단했는지 간단하게 남길 수 있어요.",
  },
  {
    title: "계획과 실제 매매를 비교해보세요",
    body: "미리 세운 계획과 실제 매매 결과를 비교하며 내 판단을 돌아볼 수 있어요.",
  },
  {
    title: "기록이 쌓이면 내 매매 경향이 보여요",
    body: "누적된 기록을 바탕으로 자주 반복되는 판단 이유와 조합을 확인할 수 있어요.",
  },
  {
    title: "이제 직접 기록해보세요",
    body: "로그인하면 매매 기록과 계획을 저장하고 계속 쌓아볼 수 있어요.",
  },
] as const;

export function OnboardingGuide() {
  const router = useRouter();
  const { seenOnboarding, skipOnboarding } = useStore();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(!seenOnboarding);
  if (!open) return null;

  function close() {
    skipOnboarding();
    setOpen(false);
  }

  const last = step === 3;
  const cur = STEPS[step];

  return (
    <div className="modal-back guide-back" onClick={close}>
      <div className="modal guide-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x" type="button" onClick={close} aria-label="닫기">
          ✕
        </button>
        <h3>{cur.title}</h3>
        <p>{cur.body}</p>
        {step === 0 ? (
          <div className="guide-preview">
            <div className="guide-kv">
              <span>구분</span>
              <b>매수</b>
            </div>
            <div className="guide-kv">
              <span>종목</span>
              <b>인플롯</b>
            </div>
            <div className="guide-kv">
              <span>수량 · 매수가</span>
              <b>10주 · 71,200원</b>
            </div>
            <div className="guide-kv">
              <span>매수일시</span>
              <b>2026-08-31 09:41</b>
            </div>
            <div className="guide-kv">
              <span>매매 이유</span>
              <b>회사의 공식 발표를 보고 · 자사주 처분</b>
            </div>
            <div className="guide-kv">
              <span>그때 마음</span>
              <b>수익 실현 만족감</b>
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="guide-preview">
            <p className="guide-block-title">매수 계획</p>
            <div className="guide-kv">
              <span>종목</span>
              <b>인플롯</b>
            </div>
            <div className="guide-kv">
              <span>희망 매수 구간</span>
              <b>70,000 ~ 74,000원</b>
            </div>
            <p className="guide-block-title">매도 계획</p>
            <div className="guide-kv">
              <span>손절선</span>
              <b>67,500원</b>
            </div>
            <div className="guide-kv">
              <span>목표가</span>
              <b>78,000원</b>
            </div>
            <div className="guide-kv">
              <span>실제 매도가</span>
              <b>78,400원</b>
            </div>
            <p className="guide-note">목표가 근처에서 계획대로 매도했어요</p>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="guide-preview">
            <p className="guide-block-title">자주 겹치는 조합 · TOP 3</p>
            <p>목표가 도달 · 확신에 찬 기대감 · 4건</p>
            <p>포트폴리오 리밸런싱 · 특별한 계기 없이 진행 · 3건</p>
            <p>추세 신호 · 고민 끝에 매도 · 2건</p>
            <p className="guide-block-title">판단 이유 한눈에 보기 · 24건</p>
            <p>회사의 공식 발표를 보고 8건 · 차트·데이터 5건</p>
          </div>
        ) : null}
        {last ? (
          <ul className="guide-points">
            <li>매매 이유와 그때 마음 기록</li>
            <li>계획과 실제 매매 비교</li>
            <li>쌓인 기록으로 알아보는 나의 매매 경향</li>
          </ul>
        ) : null}
        <div className="guide-dots" aria-hidden>
          {STEPS.map((_, i) => (
            <i key={i} className={i === step ? "on" : ""} />
          ))}
        </div>
        {last ? (
          <>
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => {
                close();
                router.push("/signup");
              }}
            >
              회원가입하고 기록하기
            </button>
            <button
              className="btn btn-ghost"
              type="button"
              style={{ marginTop: 8 }}
              onClick={() => {
                close();
                router.push("/login");
              }}
            >
              로그인
            </button>
            <button className="btn btn-ghost" type="button" style={{ marginTop: 8 }} onClick={close}>
              계속 둘러보기
            </button>
          </>
        ) : (
          <div className="modal-split">
            {step > 0 ? (
              <button className="btn btn-ghost" type="button" onClick={() => setStep((s) => s - 1)}>
                이전
              </button>
            ) : (
              <span />
            )}
            <button className="btn btn-primary" type="button" onClick={() => setStep((s) => s + 1)}>
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
