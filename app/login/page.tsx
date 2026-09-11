"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { KakaoIcon, PhoneShell } from "@/components/ui";
import { afterAuthPath } from "@/lib/format";
import { takeNext } from "@/lib/next-path";
import { hasKakaoKey, startKakaoLogin } from "@/lib/kakao";
import { consumeOAuthToast, peekOAuthToast } from "@/lib/oauth-toast";
import { bindEmailPassword, findAccountByEmail } from "@/lib/cloud";
import { hashPassword } from "@/lib/password";
import { findByEmail, upsertRegistry } from "@/lib/registry";
import { useStore } from "@/lib/store";
import { Suspense } from "react";

function AuthToast({ exists }: { exists: boolean }) {
  const { showToast } = useStore();
  useEffect(() => {
    const oauth = peekOAuthToast();
    const message = exists ? "이미 가입된 계정이에요. 로그인해 주세요" : oauth;
    if (!message) return;
    showToast(message, "info");
    const t = window.setTimeout(() => consumeOAuthToast(), 400);
    return () => window.clearTimeout(t);
    // showToast identity changes when the toast store updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exists]);
  return null;
}

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { hydrated, loggedIn, login, markWelcomeSeen, nickname, seenWelcome, showToast } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const exists = params.get("exists") === "1";

  useEffect(() => {
    if (!hydrated || !loggedIn) return;
    const dest = afterAuthPath(nickname, seenWelcome);
    router.replace(dest === "/home" ? takeNext("/home") : dest);
  }, [hydrated, loggedIn, nickname, seenWelcome, router]);

  if (!hydrated) return <div className="shell" />;

  async function submitEmail() {
    if (busy) return;
    const local = findByEmail(email);
    if (local && local.password === password) {
      const hash = await hashPassword(email, password);
      if (local.id) void bindEmailPassword(local.id, hash);
      markWelcomeSeen();
      login({ email: local.email, nickname: local.nickname, accountId: local.id, passwordHash: hash });
      return;
    }
    setBusy(true);
    try {
      const remote = await findAccountByEmail(email);
      const hash = await hashPassword(email, password);
      if (remote && (remote.passwordHash === hash || !remote.passwordHash)) {
        if (!remote.passwordHash) await bindEmailPassword(remote.id, hash);
        upsertRegistry({ id: remote.id, email: remote.email, password, nickname: remote.nickname });
        markWelcomeSeen();
        login({ email: remote.email, nickname: remote.nickname, accountId: remote.id, passwordHash: hash });
        return;
      }
      showToast("이메일 또는 비밀번호가 올바르지 않아요", "err");
    } catch {
      showToast("이메일 또는 비밀번호가 올바르지 않아요", "err");
    } finally {
      setBusy(false);
    }
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
      <AuthToast exists={exists} />
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
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
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" />
        </div>
        <div className="login-link right">
          <b role="link" onClick={() => router.push("/signup")}>
            회원가입
          </b>
        </div>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" onClick={() => void submitEmail()} disabled={!email || !password || busy}>
          {busy ? "확인 중..." : "로그인"}
        </button>
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
