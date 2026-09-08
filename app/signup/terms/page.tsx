"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { TERMS_ITEMS, TERMS_VIEW } from "@/lib/legal";
import { upsertRegistry } from "@/lib/registry";
import { uid } from "@/lib/format";
import { useStore } from "@/lib/store";
import { takeNext } from "@/lib/next-path";
import { touchRevisitCookie } from "@/lib/visit";

export default function TermsPage() {
  const router = useRouter();
  const { login, setNickname, acceptTerms, markOnboarded, markWelcomeSeen } = useStore();
  const [checks, setChecks] = useState<Record<string, boolean>>(() => Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, false])));
  const allOn = TERMS_ITEMS.every((t) => checks[t.id]);

  function toggleAll() {
    const next = !allOn;
    setChecks(Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, next])));
  }

  function finish() {
    if (!allOn) return;
    acceptTerms();
    const kind = sessionStorage.getItem("signup_kind") || "kakao";
    const nickname = sessionStorage.getItem("signup_nickname") || "회원";
    if (kind === "email") {
      const email = sessionStorage.getItem("signup_email") || "";
      const password = sessionStorage.getItem("signup_password") || "";
      const id = uid("email");
      upsertRegistry({ id, email, password, nickname });
      login({ email, nickname, accountId: id });
    } else {
      const kakaoId = sessionStorage.getItem("signup_kakao_id") || "";
      if (kakaoId) {
        upsertRegistry({ id: `kakao_${kakaoId}`, kakaoId, nickname });
        login({ kakaoId, nickname, accountId: `kakao_${kakaoId}` });
      } else {
        setNickname(nickname);
        login({ nickname });
      }
    }
    setNickname(nickname);
    markOnboarded();
    markWelcomeSeen();
    touchRevisitCookie();
    router.replace(takeNext("/home"));
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()}>
          ‹
        </button>
        <span />
      </div>
      <div className="scroll">
        <div className="step-kicker">약관 동의</div>
        <h1 className="step-title">약관에 동의해 주세요</h1>
        <div className="card" style={{ marginTop: 16 }}>
          <button className="check-row all" type="button" aria-pressed={allOn} onClick={toggleAll}>
            <i className={allOn ? "box on" : "box"} />
            <b>약관 전체 동의</b>
          </button>
          {TERMS_ITEMS.map((t) => (
            <div className="check-row" key={t.id}>
              <button type="button" aria-pressed={Boolean(checks[t.id])} onClick={() => setChecks((s) => ({ ...s, [t.id]: !s[t.id] }))}>
                <i className={checks[t.id] ? "box on" : "box"} />
                <span>
                  {t.required ? "[필수] " : "[선택] "}
                  {t.label}
                </span>
              </button>
              <a className="check-link" href={TERMS_VIEW[t.id]} target="_blank" rel="noreferrer">
                보기
              </a>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" disabled={!allOn} onClick={finish}>
          동의하고 계속하기
        </button>
      </div>
    </PhoneShell>
  );
}
