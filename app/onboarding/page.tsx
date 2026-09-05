"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChartMark, PhoneShell } from "@/components/ui";
import { DraftReview, TradeWizard } from "@/components/TradeWizard";
import { emptyDraft, useStore } from "@/lib/store";
import { PRACTICE_STOCK } from "@/lib/types";

const SLIDES = [
  {
    title: "3번만 기록하면,\n내 매매 습관이 보여요",
    body: "실제 계좌 연결 없이, 가상의 매매로\n먼저 가볍게 체험해볼 수 있어요",
  },
  {
    title: "왜 샀는지,\n그때 어떤 상태였는지",
    body: "판단 근거는 최대 3개, 당시 상태는 최대 2개까지\n고를 수 있어요. 긴 글을 쓰지 않아도 됩니다.",
  },
  {
    title: "같은 조합이 3번이면\n패턴이 보여요",
    body: "개별 기록에는 잘잘못을 붙이지 않아요.\n반복된 조합만 관찰·해석 문장으로 모아 드려요.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { markOnboarded, skipOnboarding, addTrade, plans } = useStore();
  const [stage, setStage] = useState<"slides" | "intro" | "practice" | "replay" | "join">("slides");
  const [slide, setSlide] = useState(0);
  const [draft, setDraft] = useState(() => emptyDraft("buy", PRACTICE_STOCK, true));

  function goLogin() {
    skipOnboarding();
    router.push("/login");
  }

  if (stage === "practice") {
    return (
      <PhoneShell>
        <TradeWizard
          draft={draft}
          setDraft={setDraft}
          plans={plans}
          allowSkip
          lockStock
          onClose={() => setStage("intro")}
          savingLabel="연습 기록 저장"
          onSave={() => {
            addTrade(draft);
            setStage("replay");
          }}
        />
      </PhoneShell>
    );
  }

  if (stage === "replay") {
    return (
      <PhoneShell>
        <div className="scroll">
          <div className="step-kicker">연습 기록 리플레이</div>
          <h1 className="step-title">방금 남긴 연습을 다시 보면</h1>
          <p className="sub">실제 매매도 같은 순서로 남기게 돼요. 선택값은 그대로 보여 드리고, 잘잘못 라벨은 붙이지 않아요.</p>
          <DraftReview draft={draft} />
        </div>
        <div className="footer-cta">
          <button className="btn btn-primary" type="button" onClick={() => setStage("join")}>
            다음
          </button>
        </div>
      </PhoneShell>
    );
  }

  if (stage === "join") {
    return (
      <PhoneShell>
        <div className="hero">
          <div className="blob">
            <ChartMark />
          </div>
          <h1>첫 연습 기록을 남겼어요</h1>
          <p>
            실제 매매를 같은 방식으로 3번 기록하면
            <br />
            반복되는 판단 패턴을 보여 드려요.
          </p>
        </div>
        <div className="footer-cta">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              markOnboarded();
              router.replace("/login");
            }}
          >
            가입하고 실제 기록 시작
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            style={{ marginTop: 10 }}
            onClick={() => {
              markOnboarded();
              router.replace("/home");
            }}
          >
            나중에 하기
          </button>
        </div>
      </PhoneShell>
    );
  }

  if (stage === "intro") {
    return (
      <PhoneShell>
        <div className="topbar">
          <button className="icon-btn" type="button" onClick={() => setStage("slides")} aria-label="뒤로">
            ‹
          </button>
          <span />
        </div>
        <div className="hero">
          <div className="blob">
            <ChartMark />
          </div>
          <h1>
            삼성전자로
            <br />
            연습해 볼까요?
          </h1>
          <p>
            가상의 매수 한 건을 남기면
            <br />
            실제 기록과 같은 흐름을 미리 익힐 수 있어요.
          </p>
        </div>
        <div className="footer-cta">
          <button className="btn btn-primary" type="button" onClick={() => setStage("practice")}>
            연습 기록 시작
          </button>
          <button className="btn btn-ghost" type="button" style={{ marginTop: 10 }} onClick={() => setStage("join")}>
            연습 건너뛰기
          </button>
        </div>
      </PhoneShell>
    );
  }

  const current = SLIDES[slide]!;
  const last = slide === SLIDES.length - 1;

  return (
    <PhoneShell>
      <div className="topbar">
        <span />
        <button
          className="skip"
          type="button"
          onClick={() => {
            if (last) setStage("intro");
            else setStage("intro");
          }}
        >
          건너뛰기
        </button>
      </div>
      <div className="hero">
        <div className="blob">
          <ChartMark />
        </div>
        <h1 style={{ whiteSpace: "pre-line" }}>{current.title}</h1>
        <p style={{ whiteSpace: "pre-line" }}>{current.body}</p>
        <div className="dots" aria-hidden>
          {SLIDES.map((_, i) => (
            <i key={i} className={i === slide ? "on" : ""} />
          ))}
        </div>
      </div>
      <div className="footer-cta">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            if (last) setStage("intro");
            else setSlide((s) => s + 1);
          }}
        >
          {last ? "체험 시작하기" : "다음"}
        </button>
        {slide === 0 ? (
          <div className="login-link">
            이미 계정이 있나요?{" "}
            <b role="link" onClick={goLogin}>
              로그인
            </b>
          </div>
        ) : null}
      </div>
    </PhoneShell>
  );
}
