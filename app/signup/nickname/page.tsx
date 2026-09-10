"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function NicknamePage() {
  const router = useRouter();
  const { nickname, showToast } = useStore();
  const [name, setName] = useState(nickname === "회원" ? "" : nickname);
  const err = name.trim().length > 0 && (name.trim().length < 2 || name.trim().length > 10);

  function save() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 10) {
      showToast("닉네임은 2자 이상, 10자 이내로 입력해 주세요", "err");
      return;
    }
    sessionStorage.setItem("signup_nickname", trimmed);
    sessionStorage.setItem("signup_kind", "kakao");
    router.push("/signup/terms");
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()}>
          ‹
        </button>
        <span />
      </div>
      <div className="scroll">
        <h1 className="step-title">회원가입</h1>
        <div className="field" style={{ marginTop: 20 }}>
          <label>닉네임<span className="req">*</span> ({name.trim().length}/10)</label>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 11))} placeholder="닉네임을 입력해 주세요" maxLength={11} />
          {err ? <p className="field-err">닉네임은 2자 이상, 10자 이내로 입력해 주세요</p> : null}
        </div>
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" disabled={name.trim().length < 2 || name.trim().length > 10} onClick={save}>
          가입하기
        </button>
      </div>
    </PhoneShell>
  );
}
