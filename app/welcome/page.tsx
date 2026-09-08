"use client";

import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/icons";
import { PhoneShell } from "@/components/ui";
import { takeNext } from "@/lib/next-path";
import { useStore } from "@/lib/store";

export default function WelcomePage() {
  const router = useRouter();
  const { nickname, markWelcomeSeen } = useStore();

  function start() {
    markWelcomeSeen();
    router.replace(takeNext("/home"));
  }

  return (
    <PhoneShell>
      <div className="hero">
        <div className="blob">
          <BrandMark size={64} />
        </div>
        <h1>패턴노트로<br />기록을 이어가요</h1>
        <p>
          {nickname && nickname !== "회원" ? `${nickname}님, ` : ""}
          매매를 남길수록 반복된 판단이 카드로 쌓여요.
        </p>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" onClick={start}>
          시작하기
        </button>
      </div>
    </PhoneShell>
  );
}
