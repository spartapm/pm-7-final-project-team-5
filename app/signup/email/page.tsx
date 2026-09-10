"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { emailValid, findByEmail, passwordValid } from "@/lib/registry";

export default function EmailSignupPage() {
  const router = useRouter();
  const preset = typeof window !== "undefined" ? sessionStorage.getItem("signup_email") || "" : "";
  const [email, setEmail] = useState(preset);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const emailErr = email && !emailValid(email) ? "이메일이 올바르지 않습니다" : findByEmail(email) ? "이미 가입된 이메일입니다" : "";
  const pwErr = password && !passwordValid(password) ? "영문/숫자/특수문자(공백 제외)만 허용하며, 2개 이상 조합, 10자 이상" : "";
  const confirmErr = confirm && confirm !== password ? "비밀번호가 일치하지 않습니다. 다시 확인해주세요" : "";
  const nickErr =
    nickname && (nickname.trim().length < 2 || nickname.trim().length > 10) ? "닉네임은 2자 이상, 10자 이내로 입력해 주세요" : "";
  const ok = emailValid(email) && !findByEmail(email) && passwordValid(password) && password === confirm && nickname.trim().length >= 2 && nickname.trim().length <= 10;

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
        <div className="field" style={{ marginTop: 16 }}>
          <label>이메일<span className="req">*</span></label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, email: true }))}
            placeholder="name@example.com"
          />
          {touched.email && emailErr ? <p className="field-err">{emailErr}</p> : null}
        </div>
        <div className="field">
          <label>비밀번호<span className="req">*</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, pw: true }))}
            placeholder="영문/숫자/특수문자(공백 제외) 2개 이상 조합, 10자 이상"
          />
          {touched.pw && pwErr ? <p className="field-err">{pwErr}</p> : null}
        </div>
        <div className="field">
          <label>비밀번호 확인<span className="req">*</span></label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
            placeholder="비밀번호를 한번 더 입력해 주세요"
          />
          {(touched.confirm || confirm) && confirmErr ? <p className="field-err">{confirmErr}</p> : null}
        </div>
        <div className="field">
          <label>닉네임<span className="req">*</span> ({nickname.trim().length}/10)</label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value.slice(0, 11))}
            onBlur={() => setTouched((s) => ({ ...s, nick: true }))}
            placeholder="닉네임을 입력해 주세요"
            maxLength={11}
          />
          {touched.nick && nickErr ? <p className="field-err">{nickErr}</p> : null}
        </div>
      </div>
      <div className="footer-cta">
        <button
          className="btn btn-primary"
          type="button"
          disabled={!ok}
          onClick={() => {
            sessionStorage.setItem("signup_email", email.trim());
            sessionStorage.setItem("signup_password", password);
            sessionStorage.setItem("signup_nickname", nickname.trim());
            sessionStorage.setItem("signup_kind", "email");
            router.push("/signup/terms");
          }}
        >
          가입하기
        </button>
      </div>
    </PhoneShell>
  );
}
