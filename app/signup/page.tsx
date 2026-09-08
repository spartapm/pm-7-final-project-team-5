"use client";

import { useRouter } from "next/navigation";
import { KakaoIcon, PhoneShell } from "@/components/ui";
import { BrandMark } from "@/components/icons";
import { hasKakaoKey, startKakaoLogin } from "@/lib/kakao";
import { findByEmail } from "@/lib/registry";
import { useState } from "react";
import { useStore } from "@/lib/store";

export default function SignupChoicePage() {
  const router = useRouter();
  const { showToast } = useStore();
  const [askEmail, setAskEmail] = useState(false);
  const [email, setEmail] = useState("");

  function kakao() {
    sessionStorage.setItem("kakao_intent", "signup");
    const started = startKakaoLogin();
    if (!started) showToast("카카오 키를 확인해 주세요", "err");
  }

  function continueEmail() {
    const existing = findByEmail(email);
    if (existing) {
      router.push("/login?exists=1");
      return;
    }
    sessionStorage.setItem("signup_email", email.trim());
    router.push("/signup/email");
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()}>
          ‹
        </button>
        <span />
      </div>
      <div className="hero" style={{ flex: "none" }}>
        <div className="blob">
          <BrandMark size={56} />
        </div>
        <h1>회원가입</h1>
        <p>연습 기록은 저장되지 않아요. 실제 기록은 가입 후 남길 수 있어요.</p>
      </div>
      <div className="scroll">
        {askEmail ? (
          <div className="field">
            <label>이메일</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
          </div>
        ) : null}
      </div>
      <div className="footer-cta">
        {askEmail ? (
          <button className="btn btn-primary" type="button" disabled={!email.includes("@")} onClick={continueEmail}>
            이메일로 계속하기
          </button>
        ) : (
          <button className="btn btn-primary" type="button" onClick={() => setAskEmail(true)}>
            이메일로 계속하기
          </button>
        )}
        <button className="btn btn-kakao" type="button" style={{ marginTop: 8 }} onClick={kakao}>
          <KakaoIcon />
          {hasKakaoKey() ? "카카오로 시작하기" : "카카오 설정 필요"}
        </button>
        <div className="login-link">
          이미 계정이 있나요?{" "}
          <b role="link" onClick={() => router.push("/login")}>
            로그인
          </b>
        </div>
      </div>
    </PhoneShell>
  );
}
