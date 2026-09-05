"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function NicknamePage() {
  const router = useRouter();
  const { nickname, setNickname, showToast } = useStore();
  const [name, setName] = useState(nickname === "회원" ? "" : nickname);

  function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      showToast("닉네임은 2~10자로 입력해 주세요", "err");
      return;
    }
    setNickname(trimmed);
    showToast("닉네임을 저장했어요", "ok");
    router.replace("/welcome");
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <span />
        <span />
      </div>
      <div className="scroll">
        <div className="step-kicker">회원가입</div>
        <h1 className="step-title">어떻게 불러 드릴까요?</h1>
        <p className="sub">홈 인사와 기록에 쓰이는 닉네임이에요. 2~10자.</p>
        <div className="field" style={{ marginTop: 20 }}>
          <label>닉네임</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 패턴러"
            maxLength={10}
          />
        </div>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" disabled={name.trim().length < 2} onClick={save}>
          시작하기
        </button>
      </div>
    </PhoneShell>
  );
}
