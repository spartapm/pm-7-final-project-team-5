"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/icons";
import { PhoneShell } from "@/components/ui";
import { reasonGroups, toPick } from "@/lib/categories";
import { moodOptions } from "@/lib/categories";
import { PRACTICE, SAMPLE_INSIGHT } from "@/lib/onboarding-data";
import { touchRevisitCookie } from "@/lib/visit";
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
    touchRevisitCookie();
    router.push("/signup");
  }
  function goLogin() {
    skipOnboarding();
    touchRevisitCookie();
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
          <h1 className="step-title">연습으로 본 인사이트</h1>
          <div className="tabs">
            <button type="button" className={tab === "dash" ? "on" : ""} onClick={() => setTab("dash")}>
              대시보드
            </button>
            <button type="button" className={tab === "trend" ? "on" : ""} onClick={() => setTab("trend")}>
              경향해석
            </button>
          </div>
          {tab === "dash" ? (
            <>
              <div className="card">
                <div className="stat-num">3건</div>
                <div className="sub">매수 3건 · 매도 0건</div>
              </div>
              <div className="card">
                <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>판단 이유</h2>
                <p className="sub">차트를 보고 2건 · 관련 뉴스를 보고 1건</p>
              </div>
              <div className="card">
                <h2 style={{ margin: "0 0 8px", fontSize: 16 }}>자주 겹치는 조합 TOP3</h2>
                <div className="hbar">
                  <span>매수 · 차트 · 기회</span>
                  <div className="track"><i style={{ width: "100%" }} /></div>
                  <b>2건</b>
                </div>
                <div className="hbar">
                  <span>매수 · 뉴스 · 추세</span>
                  <div className="track"><i style={{ width: "50%" }} /></div>
                  <b>1건</b>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="card">
                <p className="sub">{SAMPLE_INSIGHT.policy}</p>
              </div>
              <div className="card insight-card">
                <span className="badge">매수·차트 패턴·3건</span>
                <h3>{SAMPLE_INSIGHT.narrative1}</h3>
                <p>{SAMPLE_INSIGHT.narrative2}</p>
              </div>
            </>
          )}
        </div>
        <div className="footer-cta">
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
          <span />
          <span />
        </div>
        <div className="scroll">
          <h1 className="step-title">연습 기록 3건 완료</h1>
          {cards.map((c) => (
            <div key={c.code} className={`card ${c.highlight ? "highlight-card" : ""}`}>
              <div className="replay-head">
                <b>{c.name}</b>
                <span className="badge">{c.side}</span>
                <span className="sub">{c.n}/3</span>
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
              <p className="sub">연습에서는 ‘차트를 보고’만 선택할 수 있어요.</p>
              <div className="acc" style={{ marginTop: 16 }}>
                {groups.map((g) => (
                  <div className="acc-item" key={g.group}>
                    <button
                      className={open === g.group ? "acc-h open" : "acc-h"}
                      type="button"
                      onClick={() => {
                        if (g.group !== "차트를 보고") return;
                        setOpen(open === g.group ? "" : g.group);
                      }}
                    >
                      {g.group}
                      <span>{g.group === "차트를 보고" ? (open === g.group ? "▾" : "▸") : ""}</span>
                    </button>
                    {open === g.group && g.group === "차트를 보고" && (
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
                                setReasons((s) => (on ? s.filter((r) => r.label !== item.label) : [...s, pick].slice(0, 3)));
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
    const kicker = stage === "ex1" ? "연습 매매 · 1/3" : stage === "ex2" ? "연습 매매 · 2/3" : "연습 매매 · 3/3";
    const next = () => setStage(stage === "ex1" ? "ex2" : stage === "ex2" ? "ex3" : "reason");
    return (
      <PhoneShell>
        <div className="topbar">
          <button className="icon-btn" type="button" onClick={() => setStage(stage === "ex1" ? "intro" : stage === "ex2" ? "ex1" : "ex2")}>
            ‹
          </button>
          <button className="skip" type="button" onClick={toReplay}>
            건너뛰기
          </button>
        </div>
        <div className="scroll">
          <div className="step-kicker">{kicker} · 건너뛰기</div>
          <h1 className="step-title">이렇게 남겨 볼까요?</h1>
          <div className="card">
            {stage === "ex3" ? (
              <dl className="detail-kv">
                <dt>종목</dt>
                <dd>{data.name}</dd>
                <dt>구분</dt>
                <dd className="side-buy">{data.side}</dd>
                <dt>가격</dt>
                <dd>{data.price}</dd>
                <dt>수량</dt>
                <dd>{data.qty}</dd>
              </dl>
            ) : (
              <>
                <div className="replay-head">
                  <b>{data.name}</b>
                  <span className="badge">{data.side}</span>
                </div>
                <p>
                  {data.price} · {data.qty}
                </p>
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
              </>
            )}
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
          가상의 매매 3건으로
          <br />
          먼저 가볍게 체험할 수 있어요
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
