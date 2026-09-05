"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { afterAuthPath } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Suspense } from "react";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, seenWelcome } = useStore();
  const [hint, setHint] = useState("카카오 로그인 확인 중...");

  useEffect(() => {
    const code = params.get("code");
    const state = params.get("state");
    const saved = sessionStorage.getItem("kakao_oauth_state");
    if (!code) {
      setHint("로그인에 실패했어요. 다시 시도해 주세요.");
      return;
    }
    if (saved && state && saved !== state) {
      setHint("로그인 상태가 만료됐어요. 다시 시도해 주세요.");
      return;
    }
    (async () => {
      const res = await fetch("/api/kakao/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as { ok?: boolean; kakaoId?: string; nickname?: string; error?: string };
      if (!res.ok || !data.ok || !data.kakaoId) {
        setHint(data.error || "카카오 로그인에 실패했어요.");
        return;
      }
      login({ kakaoId: data.kakaoId, nickname: data.nickname || "회원" });
      router.replace(afterAuthPath(data.nickname || "회원", seenWelcome));
    })();
  }, [params, login, router, seenWelcome]);

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
