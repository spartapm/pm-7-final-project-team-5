"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { PhoneShell } from "@/components/ui";
import { TERMS_ITEMS, TERMS_VIEW } from "@/lib/legal";
import { hashPassword } from "@/lib/password";
import { upsertRegistry } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { takeNext } from "@/lib/next-path";

export default function TermsPage() {
  const router = useRouter();
  const { completeSignup, showToast } = useStore();
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("signup_terms");
      if (raw) {
        try {
          return JSON.parse(raw) as Record<string, boolean>;
        } catch {
          /* ignore */
        }
      }
    }
    return Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, false]));
  });
  const allOn = TERMS_ITEMS.every((t) => checks[t.id]);

  function toggleAll() {
    const next = !allOn;
    const checksNext = Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, next]));
    sessionStorage.setItem("signup_terms", JSON.stringify(checksNext));
    setChecks(checksNext);
  }

  async function finish() {
    if (!allOn || busy) return;
    setBusy(true);
    const kind = sessionStorage.getItem("signup_kind") || "kakao";
    const nickname = sessionStorage.getItem("signup_nickname") || "회원";
    try {
      if (kind === "email") {
        const email = (sessionStorage.getItem("signup_email") || "").trim().toLowerCase();
        const password = sessionStorage.getItem("signup_password") || "";
        const id = `email_${email}`;
        const passwordHash = email && password ? await hashPassword(email, password) : undefined;
        upsertRegistry({ id, email, password, nickname });
        await completeSignup({ accountId: id, email, nickname, passwordHash });
      } else {
        const kakaoId = sessionStorage.getItem("signup_kakao_id") || "";
        if (kakaoId) {
          upsertRegistry({ id: `kakao_${kakaoId}`, kakaoId, nickname });
          await completeSignup({ accountId: `kakao_${kakaoId}`, kakaoId, nickname });
        } else {
          await completeSignup({ accountId: `acc_${Date.now()}`, nickname });
        }
      }
      router.replace(takeNext("/home"));
    } catch {
      showToast("가입을 저장하지 못했어요. 다시 시도해 주세요", "err");
      setBusy(false);
    }
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
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
              <button
                type="button"
                aria-pressed={Boolean(checks[t.id])}
                onClick={() =>
                  setChecks((s) => {
                    const next = { ...s, [t.id]: !s[t.id] };
                    sessionStorage.setItem("signup_terms", JSON.stringify(next));
                    return next;
                  })
                }
              >
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
        <button className="btn btn-primary" type="button" disabled={!allOn || busy} onClick={() => void finish()}>
          {busy ? "저장 중..." : "동의하고 계속하기"}
        </button>
      </div>
    </PhoneShell>
  );
}
