"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { afterAuthPath } from "@/lib/format";
import { takeNext } from "@/lib/next-path";
import { kakaoRedirectUri } from "@/lib/kakao";
import { findAccountByKakao } from "@/lib/cloud";
import { findByKakao, upsertRegistry } from "@/lib/registry";
import { useStore } from "@/lib/store";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, loggedIn, nickname, seenWelcome, querying } = useStore();
  const [hint, setHint] = useState("카카오 로그인 확인 중...");
  const [done, setDone] = useState(false);
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    const err = params.get("error");
    if (err === "access_denied") {
      setHint("카카오 로그인을 취소했어요.");
      return;
    }
    if (err) {
      setHint("로그인에 실패했어요. 다시 시도해 주세요.");
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
      let existing = findByKakao(data.kakaoId);
      if (!existing) {
        const remote = await findAccountByKakao(data.kakaoId);
        if (remote) {
          existing = { id: remote.id, kakaoId: remote.kakaoId, nickname: remote.nickname };
          upsertRegistry(existing);
        }
      }
      if (intent === "signup" && existing) {
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
      setDone(true);
    })();
  }, [params, login, router]);

  useEffect(() => {
    if (!done || !loggedIn || querying) return;
    const dest = afterAuthPath(nickname, seenWelcome);
    router.replace(dest === "/home" ? takeNext("/home") : dest);
  }, [done, loggedIn, querying, nickname, seenWelcome, router]);

  return (
    <PhoneShell>
      <div className="hero">
        <h1>{hint}</h1>
        <button className="btn btn-ghost" type="button" onClick={() => router.replace("/login")}>
          로그인으로 돌아가기
        </button>
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
