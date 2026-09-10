"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KakaoIcon, PhoneShell } from "@/components/ui";
import { afterAuthPath } from "@/lib/format";
import { takeNext } from "@/lib/next-path";
import { hasKakaoKey, startKakaoLogin } from "@/lib/kakao";
import { findByEmail } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { Suspense } from "react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { hydrated, loggedIn, login, nickname, seenWelcome, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const exists = params.get("exists") === "1";

  useEffect(() => {
    if (exists) showToast("이미 가입된 계정이에요. 로그인해 주세요", "info");
  }, [exists, showToast]);

  useEffect(() => {
    if (!hydrated || !loggedIn) return;
    const dest = afterAuthPath(nickname, seenWelcome);
    router.replace(dest === "/home" ? takeNext("/home") : dest);
  }, [hydrated, loggedIn, nickname, seenWelcome, router]);

  if (!hydrated) return <div className="shell" />;

  function submitEmail() {
    const row = findByEmail(email);
    if (!row || row.password !== password) {
      showToast("이메일 또는 비밀번호가 올바르지 않아요", "err");
      return;
    }
    login({ email: row.email, nickname: row.nickname, accountId: row.id });
  }

  function kakao() {
    sessionStorage.setItem("kakao_intent", "login");
    const started = startKakaoLogin();
    if (!started) {
      showToast("카카오 키를 확인해 주세요", "err");
    }
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()}>
          ‹
        </button>
        <span />
      </div>
      <div className="hero" style={{ flex: "none", paddingTop: 24 }}>
        <h1>로그인</h1>
      </div>
      <div className="scroll">
        <button className="btn btn-kakao" type="button" onClick={kakao}>
          <KakaoIcon />
          {hasKakaoKey() ? "카카오로 로그인" : "카카오 설정 필요"}
        </button>
        <p className="or-line">또는</p>
        <div className="field">
          <label>이메일</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일" />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
        </div>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" onClick={submitEmail} disabled={!email || !password}>
          로그인
        </button>
        <div className="login-link">
          계정이 없나요?{" "}
          <b role="link" onClick={() => router.push("/signup")}>
            회원가입
          </b>
        </div>
      </div>
    </PhoneShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="shell" />}>
      <LoginInner />
    </Suspense>
  );
}
