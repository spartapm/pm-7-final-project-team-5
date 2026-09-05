"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KakaoIcon, PhoneShell } from "@/components/ui";
import { afterAuthPath } from "@/lib/format";
import { hasKakaoKey, startKakaoLogin } from "@/lib/kakao";
import { TERMS_BODY, PRIVACY_BODY, TERMS_ITEMS } from "@/lib/legal";
import { useStore } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const { hydrated, loggedIn, login, termsAccepted, acceptTerms, nickname, seenWelcome, showToast } = useStore();
  const [doc, setDoc] = useState<null | "terms" | "privacy">(null);
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, false]))
  );

  const allOn = TERMS_ITEMS.every((t) => checks[t.id]);
  const canAuth = termsAccepted || allOn;

  useEffect(() => {
    if (termsAccepted) setChecks(Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, true])));
  }, [termsAccepted]);

  useEffect(() => {
    if (!hydrated || !loggedIn) return;
    router.replace(afterAuthPath(nickname, seenWelcome));
  }, [hydrated, loggedIn, nickname, seenWelcome, router]);

  if (!hydrated) return <div className="shell" />;

  function toggleAll() {
    const next = !allOn;
    setChecks(Object.fromEntries(TERMS_ITEMS.map((t) => [t.id, next])));
  }

  function startAuth(kind: "kakao" | "demo") {
    if (!canAuth) {
      showToast("필수 약관에 동의해 주세요", "err");
      return;
    }
    if (!termsAccepted) acceptTerms();
    if (kind === "demo") {
      login({ nickname: "회원" });
      router.replace("/signup/nickname");
      return;
    }
    setBusy(true);
    const started = startKakaoLogin();
    if (!started) {
      login({ nickname: "회원" });
      setBusy(false);
      router.replace("/signup/nickname");
    }
  }

  return (
    <PhoneShell>
      <div className="hero" style={{ flex: "none", paddingTop: 56 }}>
        <div className="blob" style={{ background: "#fff", width: 88, height: 88, marginBottom: 20 }}>
          <div style={{ fontWeight: 900, fontSize: 32, color: "var(--navy)" }}>P</div>
        </div>
        <h1>기록하고,<br />패턴을 발견하세요</h1>
        <p>
          카카오로 시작하면 기록이 클라우드에 저장되고
          <br />
          다른 기기에서도 이어서 볼 수 있어요.
        </p>
      </div>
      <div className="scroll">
        <div className="card">
          <button className="check-row all" type="button" onClick={toggleAll}>
            <i className={allOn ? "box on" : "box"} />
            <b>약관 전체 동의</b>
          </button>
          {TERMS_ITEMS.map((t) => (
            <div className="check-row" key={t.id}>
              <button type="button" onClick={() => setChecks((s) => ({ ...s, [t.id]: !s[t.id] }))}>
                <i className={checks[t.id] ? "box on" : "box"} />
                <span>
                  {t.required ? "[필수] " : "[선택] "}
                  {t.label}
                </span>
              </button>
              {t.id === "service" || t.id === "privacy" ? (
                <button
                  className="check-link"
                  type="button"
                  onClick={() => setDoc(t.id === "service" ? "terms" : "privacy")}
                >
                  보기
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="footer-cta">
        <button className="btn btn-kakao" type="button" disabled={busy || !canAuth} onClick={() => startAuth("kakao")}>
          <KakaoIcon />
          {hasKakaoKey() ? "카카오로 시작하기" : "데모로 시작하기"}
        </button>
        {hasKakaoKey() ? (
          <button
            className="btn btn-ghost"
            type="button"
            style={{ marginTop: 8 }}
            disabled={!canAuth}
            onClick={() => startAuth("demo")}
          >
            카카오 없이 둘러보기
          </button>
        ) : null}
      </div>
      {doc ? (
        <div className="modal-back">
          <div className="modal" style={{ maxHeight: "72vh", overflow: "auto" }}>
            <h3>{doc === "terms" ? "서비스 이용약관" : "개인정보 처리방침"}</h3>
            <pre className="legal-doc">{doc === "terms" ? TERMS_BODY : PRIVACY_BODY}</pre>
            <button className="btn btn-primary" type="button" style={{ marginTop: 12 }} onClick={() => setDoc(null)}>
              닫기
            </button>
          </div>
        </div>
      ) : null}
    </PhoneShell>
  );
}
