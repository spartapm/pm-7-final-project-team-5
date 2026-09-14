"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { BrandMark } from "@/components/icons";
import { onboardingElapsedSec, onboardingSessionId, trackOnce } from "@/lib/analytics";
import { reasonGroups, toPick } from "@/lib/categories";
import { moodOptions } from "@/lib/categories";
import { PRACTICE, SAMPLE_INSIGHT } from "@/lib/onboarding-data";
import { useStore } from "@/lib/store";
import type { CategoryPick } from "@/lib/types";

function Lines({ items }: { items: string[] }) {
  return (
    <p className="stack-lines">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </p>
  );
}

function OnbNote({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="onb-note">
      <span className="onb-note-label">{label}</span>
      <Lines items={items} />
    </div>
  );
}

function OnbTrade({ name, side, price, qty }: { name: string; side: string; price: string; qty: string }) {
  return (
    <dl className="onb-kv">
      <div>
        <dt>종목 · 구분</dt>
        <dd>
          {name} · {side}
        </dd>
      </div>
      <div>
        <dt>가격 · 수량</dt>
        <dd>
          {price} · {qty}
        </dd>
      </div>
    </dl>
  );
}

function OnbReportDash() {
  return (
    <img
      src="/figma/insight-report-2x.png"
      alt="인사이트 리포트"
      className="example-report"
      width={750}
      height={3038}
    />
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { skipOnboarding, showToast } = useStore();
  const [stage, setStage] = useState<"intro" | "ex1" | "ex2" | "ex3" | "reason" | "mood" | "replay" | "report">("intro");
  const [tab, setTab] = useState<"dash" | "trend">("dash");
  const [open, setOpen] = useState("차트를 보고");
  const [reasons, setReasons] = useState<CategoryPick[]>([]);
  const [moods, setMoods] = useState<CategoryPick[]>([]);
  const groups = reasonGroups();
  const moodList = moodOptions("buy");
  const stepsDone = useRef(0);

  useEffect(() => {
    if (stage !== "intro") return;
    const sid = onboardingSessionId();
    trackOnce(`onboarding_view:${sid}`, "onboarding_view", {
      onboarding_session_id: sid,
      entry_source: "app_open",
      screen_id: "0-1",
      screen_name: "onboarding_intro",
    });
  }, [stage]);

  function goSignup() {
    skipOnboarding();
    sessionStorage.setItem("signup_source", "onboarding");
    router.push("/signup");
  }
  function goLogin() {
    skipOnboarding();
    router.push("/login");
  }
  function toReplay() {
    setStage("replay");
  }

  const naverReasons = reasons.length ? reasons : PRACTICE.naver.reasonsDefault;
  const naverMoods = moods.length ? moods : PRACTICE.naver.moodsDefault;

  if (stage === "report") {
    return (
      <PhoneShell>
        <div className="scroll">
          <div className="step-kicker">연습 기록 3건 기준</div>
          <h1 className="step-title">첫 인사이트 리포트</h1>
          <div className="tabs">
            <button type="button" className={tab === "dash" ? "on" : ""} onClick={() => setTab("dash")}>
              대시보드
            </button>
            <button type="button" className={tab === "trend" ? "on" : ""} onClick={() => setTab("trend")}>
              경향해석
            </button>
          </div>
          {tab === "dash" ? (
            <OnbReportDash />
          ) : (
            <>
              <div className="insight-policy">
                <p className="policy-title">{SAMPLE_INSIGHT.policy}</p>
                <p className="policy-sub">{SAMPLE_INSIGHT.policySub}</p>
              </div>
              <div className="date-group">
                <div className="date-group-h">
                  <b>오늘 발행</b>
                </div>
                <div className="card insight-card accent onb-insight">
                  <span className="badge">📉 매수 · 차트 패턴 · 2건</span>
                  <p className="narrative1 keep">{SAMPLE_INSIGHT.narrative1}</p>
                  <p className="narrative2 keep">{SAMPLE_INSIGHT.narrative2}</p>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="footer-cta">
          <p className="report-cta-title">이제 진짜 기록을 시작해볼까요?</p>
          <button className="btn btn-primary" type="button" onClick={goSignup}>
            회원가입하고 시작하기
          </button>
          <p className="sub" style={{ textAlign: "center" }}>
            지금까지의 연습 기록은 저장되지 않아요
          </p>
        </div>
      </PhoneShell>
    );
  }

  if (stage === "replay") {
    const cards = [
      { ...PRACTICE.samsung, highlight: false, n: 1, r: PRACTICE.samsung.reasons, m: PRACTICE.samsung.moods },
      { ...PRACTICE.kakao, highlight: false, n: 2, r: PRACTICE.kakao.reasons, m: PRACTICE.kakao.moods },
      {
        name: PRACTICE.naver.name,
        code: PRACTICE.naver.code,
        side: "매수" as const,
        price: PRACTICE.naver.price,
        qty: PRACTICE.naver.qty,
        highlight: true,
        n: 3,
        r: naverReasons.map((x) => (typeof x === "string" ? x : `${x.group} · ${x.label}`)),
        m: naverMoods.map((x) => (typeof x === "string" ? x : x.label)),
      },
    ];
    return (
      <PhoneShell>
        <div className="topbar wizard-head">
          <span className="wizard-kicker">연습 기록 3건 완료</span>
        </div>
        <div className="step-track slim" aria-hidden>
          <i style={{ width: "100%" }} />
        </div>
        <div className="scroll">
          <h1 className="step-title">3건을 이렇게 기록했어요</h1>
          <p className="sub onb-lead">기록이 쌓이면 이렇게 다시 볼 수 있어요</p>
          {cards.map((c) => (
            <div key={c.code} className={`card ${c.highlight ? "highlight-card" : ""}`}>
              <div className="replay-head">
                <div className="replay-name">
                  <b>{c.name}</b>
                  <span className="badge">{c.side}</span>
                </div>
                <span className="replay-rank">{c.n === 3 ? "3번째 · 방금" : `${c.n}번째`}</span>
              </div>
              <OnbTrade name={c.name} side={c.side} price={c.price} qty={c.qty} />
              <OnbNote label="매매 이유" items={c.r} />
              <OnbNote label="그때 마음" items={c.m} />
            </div>
          ))}
        </div>
        <div className="footer-cta">
          <button className="btn btn-primary" type="button" onClick={() => setStage("report")}>
            인사이트 리포트 확인하기
          </button>
        </div>
      </PhoneShell>
    );
  }

  if (stage === "reason" || stage === "mood") {
    const kicker = stage === "reason" ? "매수 기록 · 1 / 3 단계" : "매수 기록 · 2 / 3 단계";
    return (
      <PhoneShell>
        <div className="topbar wizard-head">
          <span className="wizard-kicker">{kicker}</span>
          <button className="skip" type="button" onClick={toReplay}>
            건너뛰기
          </button>
        </div>
        <div className="step-track slim" aria-hidden>
          <i style={{ width: stage === "reason" ? "33%" : "66%" }} />
        </div>
        <div className="scroll">
          {stage === "reason" ? (
            <>
              <h1 className="step-title">이번 매수는 무엇을 보고 결정하셨어요?</h1>
              <p className="sub">
                매수할 때 참고한 내용을 선택해 주세요.
                <br />
                최대 3개까지 고를 수 있어요. ({reasons.length}/3)
              </p>
              <div className="acc" style={{ marginTop: 16 }}>
                {groups.map((g) => {
                  const locked = g.group !== "차트를 보고";
                  const shown = open === g.group;
                  return (
                  <div className={`acc-item ${shown ? "has" : ""} ${locked ? "locked" : ""}`} key={g.group}>
                    <button
                      className={shown ? "acc-h open" : "acc-h"}
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        if (locked) return;
                        setOpen(open === g.group ? "" : g.group);
                      }}
                    >
                      {g.group}
                      <span>{shown ? "▾" : "▸"}</span>
                    </button>
                    {open === g.group && (
                      <div className="acc-body">
                        {g.items.map((item) => {
                          const on = reasons.some((r) => r.label === item.label);
                          return (
                            <button
                              key={item.label}
                              type="button"
                              className={on ? "chip on" : "chip"}
                              onClick={() => {
                                const pick = toPick(item);
                                setReasons((s) => {
                                  if (on) return s.filter((r) => r.label !== item.label);
                                  if (s.length >= 3) {
                                    showToast("이 옵션을 선택하려면 하나를 해제해주세요", "info");
                                    return s;
                                  }
                                  return [...s, pick];
                                });
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h1 className="step-title">그때 마음은 어떠셨어요?</h1>
              <p className="sub">가장 가까운 마음을 골라주세요. (최대 2개)</p>
              <div className="mood-list" style={{ marginTop: 16 }}>
                {moodList.map((m) => {
                  const on = moods.some((x) => x.label === m.label);
                  return (
                    <button
                      key={m.label}
                      type="button"
                      className={on ? "mood on" : "mood"}
                      onClick={() => {
                        if (!on && moods.length >= 2) {
                          showToast("이 옵션을 선택하려면 하나를 해제해주세요", "info");
                          return;
                        }
                        setMoods((s) => (on ? s.filter((x) => x.label !== m.label) : [...s, toPick(m)]));
                      }}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        <div className="footer-cta">
          <button
            className="btn btn-primary"
            type="button"
            disabled={stage === "reason" ? reasons.length === 0 : moods.length === 0}
            onClick={() => (stage === "reason" ? setStage("mood") : toReplay())}
          >
            다음
          </button>
        </div>
      </PhoneShell>
    );
  }

  if (stage === "ex1" || stage === "ex2" || stage === "ex3") {
    const data = stage === "ex1" ? PRACTICE.samsung : stage === "ex2" ? PRACTICE.kakao : PRACTICE.naver;
    const step = stage === "ex3" ? "3 / 3" : stage === "ex2" ? "2 / 3" : "1 / 3";
    const head = stage === "ex3" ? "연습 매매" : "예시 과거 기록";
    const next = () => {
      stepsDone.current += 1;
      if (stage === "ex3") {
        const sid = onboardingSessionId();
        trackOnce(`onboarding_complete:${sid}`, "onboarding_complete", {
          onboarding_session_id: sid,
          completed_step_count: Math.max(4, stepsDone.current + 1),
          elapsed_active_sec: onboardingElapsedSec(),
          screen_id: "0-5",
          screen_name: "onboarding_reason",
        });
        setStage("reason");
        return;
      }
      setStage(stage === "ex1" ? "ex2" : "ex3");
    };
    const title = stage === "ex3" ? "이번 연습 매매 정보예요" : "이렇게 기록했어요";
    const situation = "situation" in data ? data.situation : "";
    return (
      <PhoneShell>
        <div className="onb-head">
          <b>{head}</b>
          <span className="spacer" />
          <span className="badge">{step}</span>
          <button className="skip" type="button" onClick={toReplay}>
            건너뛰기
          </button>
        </div>
        <div className="scroll">
          <h1 className="step-title">{title}</h1>
          {situation ? (
            <div className="onb-situation">
              <span className="badge">가상 상황</span>
              <p>{situation}</p>
            </div>
          ) : null}
          <div className="card onb-kv-card">
            <OnbTrade name={data.name} side={data.side} price={data.price} qty={data.qty} />
          </div>
          {stage === "ex3" ? <p className="sub onb-fixed-note">예시로 고정된 정보예요</p> : null}
          {"reasons" in data ? (
            <>
              <OnbNote label="매매 이유" items={data.reasons} />
              <OnbNote label="그때 마음" items={data.moods} />
            </>
          ) : null}
        </div>
        <div className="footer-cta">
          <button className="btn btn-primary" type="button" onClick={next}>
            다음
          </button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="hero">
        <BrandMark size={64} />
        <h1>
          3번만 기록하면,
          <br />
          내 매매 습관이 보여요
        </h1>
        <p>
          실제 계좌 연결 없이, 가상의 매매로
          <br />
          먼저 가볍게 체험해볼 수 있어요
        </p>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" onClick={() => setStage("ex1")}>
          체험 시작하기
        </button>
        <div className="login-link center">
          이미 계정이 있나요?{" "}
          <b role="link" onClick={goLogin}>
            로그인
          </b>
        </div>
      </div>
    </PhoneShell>
  );
}
