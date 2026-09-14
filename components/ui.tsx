"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { TERMS_VIEW } from "@/lib/legal";
import { useStore } from "@/lib/store";
import { HomeIcon, InsightIcon, PlanIcon, RecordIcon } from "@/components/icons";

export function PhoneShell({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <div className="shell-body">
        {children}
        <ToastHost />
      </div>
    </div>
  );
}

export function TabBar() {
  const path = usePathname();
  const { issuedCards } = useStore();
  const unread = issuedCards.some((c) => !c.read);
  const onInsights = path.startsWith("/insights");
  useEffect(() => {
    document.querySelectorAll(".scroll").forEach((el) => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, [path]);
  const tabs = [
    { href: "/home", label: "홈", icon: HomeIcon },
    { href: "/plan", label: "계획", icon: PlanIcon },
    { href: "/records", label: "기록", icon: RecordIcon },
    { href: "/insights", label: "인사이트", icon: InsightIcon },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => {
        const on = path === t.href || path.startsWith(t.href + "/");
        const Icon = t.icon;
        const showBadge = t.href === "/insights" && unread && !onInsights;
        return (
          <Link key={t.href} href={t.href} className={on ? "on" : ""}>
            <span className="tab-ico">
              <Icon on={on} />
              {showBadge ? <i className="tab-badge" /> : null}
            </span>
            {t.label}
            {showBadge ? <span className="tab-tip">새로운 인사이트</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function ChartMark() {
  return (
    <svg width="88" height="64" viewBox="0 0 88 64" fill="none">
      <rect x="8" y="12" width="72" height="40" rx="4" stroke="#EAEDF0" />
      <rect x="18" y="28" width="10" height="18" rx="2" fill="#A6B8D1" />
      <rect x="36" y="20" width="10" height="26" rx="2" fill="#C99A3D" />
      <rect x="54" y="24" width="10" height="22" rx="2" fill="#476B9E" />
    </svg>
  );
}

export function PlanEmptyMark() {
  return <img src="/figma/plan-empty-icon.png" alt="" width={115} height={115} className="plan-empty-ico" />;
}

export function ChoiceSheet({
  title,
  left,
  right,
  onLeft,
  onRight,
  onClose,
}: {
  title: string;
  left: string;
  right: string;
  onLeft: () => void;
  onRight: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal choice-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x" type="button" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <h3 className="choice-title">{title}</h3>
        <div className="modal-split">
          <button className="btn btn-ghost" type="button" onClick={onLeft}>
            {left}
          </button>
          <button className="btn btn-primary" type="button" onClick={onRight}>
            {right}
          </button>
        </div>
      </div>
    </div>
  );
}

export function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2C4.8 2 1.4 4.7 1.4 8c0 2.1 1.4 4 3.6 5.1l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.1 0 .3 0 .4 0 4.2 0 7.6-2.7 7.6-6.2S13.2 2 9 2z"
        fill="#191919"
      />
    </svg>
  );
}

export function Toast({
  message,
  kind = "ok",
  onDone,
}: {
  message: string;
  kind?: "ok" | "err" | "info";
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <div className={`toast ${kind}`}>
      <span className="toast-dot" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function ToastHost() {
  const { toast, clearToast } = useStore();
  if (!toast) return null;
  return <Toast message={toast.message} kind={toast.kind} onDone={clearToast} />;
}

export function Modal({
  title,
  body,
  cancel = "돌아가기",
  confirm,
  split = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  cancel?: string;
  confirm: string;
  split?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-back">
      <div className="modal">
        <h3>{title}</h3>
        <p>{body}</p>
        {split ? (
          <div className="modal-split">
            <button className="btn btn-ghost" type="button" onClick={onCancel}>
              {cancel}
            </button>
            <button className="btn btn-primary" type="button" onClick={onConfirm}>
              {confirm}
            </button>
          </div>
        ) : (
          <>
            <button className="btn btn-primary" type="button" onClick={onConfirm} style={{ marginBottom: 8 }}>
              {confirm}
            </button>
            <button className="btn btn-ghost" type="button" onClick={onCancel}>
              {cancel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export const LEGAL =
  "인플롯은 투자자문업자 또는 유사투자자문업자가 아니며, 이용자가 입력한 기록을 계산해 지난 매매의 경향을 보여줍니다. 특정 종목의 매매를 권유하지 않으며, 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.";

export function LegalFooter() {
  return (
    <div className="legal-block">
      <p className="legal">{LEGAL}</p>
      <div className="legal-links">
        <a href={TERMS_VIEW.service} target="_blank" rel="noreferrer">
          이용약관
        </a>
        <a href={TERMS_VIEW.privacy} target="_blank" rel="noreferrer">
          개인정보 약관
        </a>
        <a href="mailto:hello@patternnote.app">문의하기</a>
      </div>
      <p className="copy">© 2026 인플롯</p>
    </div>
  );
}
