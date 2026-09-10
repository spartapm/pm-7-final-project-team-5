"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/icons";
import { PhoneShell } from "@/components/ui";
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

  function goSignup() {
    skipOnboarding();
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
            <img src="/brand/insight-report-sample.png" alt="첫 인사이트 리포트 예시" className="example-report" width={375} height={1519} />
          ) : (
            <>
              <div className="card">
                <p className="sub" style={{ fontWeight: 700, color: "#264d80" }}>{SAMPLE_INSIGHT.policy}</p>
                <p className="sub">{SAMPLE_INSIGHT.policySub}</p>
              </div>
              <div className="card insight-card">
                <span className="badge">📉 매수 · 차트 패턴 · 2건</span>
                <h3>최근 매수 기록 중 2건에서 “차트에서 자주 멈추던 가격대를 뚫고 움직였다"는 이유가 반복됐어요.</h3>
                <p>가격이 크게 떨어졌을 때 반사적으로 매수하는 경향이 보여요.</p>
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
        <div className="topbar">
          <span className="h1" style={{ fontSize: 16 }}>
            연습 기록 3건 완료
          </span>
          <span />
        </div>
        <div className="scroll">
          <h1 className="step-title">3건을 이렇게 기록했어요</h1>
          <p className="sub">기록이 쌓이면 이렇게 다시 볼 수 있어요</p>
          {cards.map((c) => (
            <div key={c.code} className={`card ${c.highlight ? "highlight-card" : ""}`}>
              <div className="replay-head">
                <b>{c.name}</b>
                <span className="badge">{c.side}</span>
                <span className="sub">{c.n === 3 ? "3번째 · 방금" : `${c.n}번째`}</span>
              </div>
              <p className="sub">
                {c.price} · {c.qty}
              </p>
              <div className="sub" style={{ marginTop: 8 }}>
                매매 이유
                <Lines items={c.r} />
              </div>
              <div className="sub" style={{ marginTop: 8 }}>
                그때 마음
                <Lines items={c.m} />
              </div>
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
    const kicker = stage === "reason" ? "매수 기록 · 1/3 단계" : "매수 기록 · 2/3 단계";
    return (
      <PhoneShell>
        <div className="topbar">
          <button className="icon-btn" type="button" onClick={() => setStage(stage === "reason" ? "ex3" : "reason")}>
            ‹
          </button>
          <button className="skip" type="button" onClick={toReplay}>
            건너뛰기
          </button>
        </div>
        <div className="step-track" aria-hidden>
          <i style={{ width: stage === "reason" ? "33%" : "66%" }} />
        </div>
        <div className="scroll">
          <div className="step-kicker">{kicker}</div>
          {stage === "reason" ? (
            <>
              <h1 className="step-title">이번 매수는 무엇을 보고 결정하셨어요?</h1>
              <p className="sub">매수할 때 참고한 내용을 선택해 주세요. 최대 3개까지 고를 수 있어요. ({reasons.length}/3)</p>
              <div className="acc" style={{ marginTop: 16 }}>
                {groups.map((g) => (
                  <div className="acc-item" key={g.group}>
                    <button
                      className={open === g.group ? "acc-h open" : "acc-h"}
                      type="button"
                      onClick={() => setOpen(open === g.group ? "" : g.group)}
                    >
                      {g.group}
                      <span>{open === g.group ? "▾" : "▸"}</span>
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
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="step-title">당시 어떤 상태였나요?</h1>
              <p className="sub">최대 2개까지 고를 수 있어요. ({moods.length}/2)</p>
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
    const next = () => setStage(stage === "ex1" ? "ex2" : stage === "ex2" ? "ex3" : "reason");
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
            <div className="card">
              <span className="badge">가상 상황</span>
              <p style={{ marginTop: 8 }}>{situation}</p>
            </div>
          ) : null}
          <div className="card">
            <dl className="detail-kv trade-mini">
              <dt>종목 · 구분</dt>
              <dd>
                {data.name} · {data.side}
              </dd>
              <dt>가격 · 수량</dt>
              <dd>
                {data.price} · {data.qty}
              </dd>
            </dl>
            {stage === "ex3" ? <p className="sub">예시로 고정된 정보예요</p> : null}
            {"reasons" in data ? (
              <>
                <div className="sub" style={{ marginTop: 12 }}>
                  매매 이유
                  <Lines items={data.reasons} />
                </div>
                <div className="sub" style={{ marginTop: 8 }}>
                  그때 마음
                  <Lines items={data.moods} />
                </div>
              </>
            ) : null}
          </div>
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
        <div className="blob">
          <BrandMark size={64} />
        </div>
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
        <div className="login-link">
          이미 계정이 있나요?{" "}
          <b role="link" onClick={goLogin}>
            로그인
          </b>
        </div>
      </div>
    </PhoneShell>
  );
}
