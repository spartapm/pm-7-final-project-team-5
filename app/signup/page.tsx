"use client";

import { useRouter } from "next/navigation";
import { KakaoIcon, PhoneShell } from "@/components/ui";
import { hasKakaoKey, startKakaoLogin } from "@/lib/kakao";
import { useStore } from "@/lib/store";

export default function SignupChoicePage() {
  const router = useRouter();
  const { showToast } = useStore();

  function kakao() {
    sessionStorage.setItem("kakao_intent", "signup");
    const started = startKakaoLogin();
    if (!started) showToast("카카오 키를 확인해 주세요", "err");
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
        <h1>
          회원가입하고
          <br />
          기록을 이어가요
        </h1>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" onClick={() => router.push("/signup/email")}>
          이메일로 계속하기
        </button>
        <p className="or-line">또는</p>
        <button className="btn btn-kakao" type="button" onClick={kakao}>
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
