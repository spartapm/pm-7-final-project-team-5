"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { BrandMark } from "@/components/icons";
import { needsNickname } from "@/lib/format";
import { takeNext } from "@/lib/next-path";
import { kakaoRedirectUri } from "@/lib/kakao";
import { findAccountByKakao } from "@/lib/cloud";
import { stashOAuthToast } from "@/lib/oauth-toast";
import { findByKakao, upsertRegistry } from "@/lib/registry";
import { useStore } from "@/lib/store";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, markWelcomeSeen } = useStore();
  const [hint, setHint] = useState("카카오 로그인 확인 중...");
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    const err = params.get("error");
    if (err === "access_denied") {
      once.current = true;
      const intent = sessionStorage.getItem("kakao_intent") || "login";
      stashOAuthToast("카카오 로그인을 취소했어요");
      router.replace(intent === "signup" ? "/signup" : "/login");
      return;
    }
    if (err) {
      once.current = true;
      stashOAuthToast("로그인에 실패했어요. 다시 시도해 주세요");
      router.replace("/login");
      return;
    }
    const code = params.get("code");
    const state = params.get("state");
    const saved = sessionStorage.getItem("kakao_oauth_state");
    const redirectUri = sessionStorage.getItem("kakao_oauth_redirect") || kakaoRedirectUri();
    if (!code) {
      setHint("로그인에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    if (saved && state && saved !== state) {
      setHint("로그인 상태가 만료됐어요. 다시 시도해 주세요.");
      return;
    }
    once.current = true;
    (async () => {
      const res = await fetch("/api/kakao/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      });
      const data = (await res.json()) as { ok?: boolean; kakaoId?: string; error?: string };
      sessionStorage.removeItem("kakao_oauth_state");
      sessionStorage.removeItem("kakao_oauth_redirect");
      if (!res.ok || !data.ok || !data.kakaoId) {
        setHint(data.error || "카카오 로그인에 실패했어요.");
        once.current = false;
        return;
      }
      const intent = sessionStorage.getItem("kakao_intent") || "login";
      sessionStorage.removeItem("kakao_intent");
      const local = findByKakao(data.kakaoId);
      const remote = await findAccountByKakao(data.kakaoId);
      let existing = local;
      if (remote) {
        const nickname = !needsNickname(remote.nickname) ? remote.nickname : local?.nickname || remote.nickname;
        existing = { id: remote.id, kakaoId: remote.kakaoId, nickname };
        upsertRegistry(existing);
      }
      if (intent === "signup" && existing && (remote?.onboarded || !needsNickname(existing.nickname))) {
        router.replace("/login?exists=1");
        return;
      }
      if (!existing) {
        sessionStorage.setItem("signup_kakao_id", data.kakaoId);
        sessionStorage.setItem("signup_kind", "kakao");
        router.replace("/signup/nickname");
        return;
      }
      login({ kakaoId: data.kakaoId, nickname: existing.nickname, accountId: existing.id });
      if (needsNickname(existing.nickname) && !remote?.onboarded) {
        sessionStorage.setItem("signup_kakao_id", data.kakaoId);
        sessionStorage.setItem("signup_kind", "kakao");
        router.replace("/signup/nickname");
        return;
      }
      markWelcomeSeen();
      router.replace(takeNext("/home"));
    })();
  }, [params, login, markWelcomeSeen, router]);

  const failed = hint !== "카카오 로그인 확인 중...";

  return (
    <PhoneShell>
      <div className="kakao-wait">
        <div className="kakao-wait-body">
          {failed ? null : <BrandMark size={36} />}
          {failed ? null : <i className="spinner" aria-hidden />}
          <h1>{failed ? hint : "카카오 로그인 확인 중"}</h1>
          {failed ? null : (
            <p className="sub">
              계정 정보를 받아오고 있어요
              <br />
              잠시만 기다려 주세요
            </p>
          )}
        </div>
        {failed ? (
          <div className="footer-cta">
            <button className="btn btn-ghost" type="button" onClick={() => router.replace("/login")}>
              로그인으로 돌아가기
            </button>
          </div>
        ) : null}
      </div>
    </PhoneShell>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={<div className="shell" />}>
      <CallbackInner />
    </Suspense>
  );
}
