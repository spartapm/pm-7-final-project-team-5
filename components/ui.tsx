"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { issuedInsights } from "@/lib/insights";

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
  const { trades, seenInsightKeys, markInsightsSeen } = useStore();
  const unread = issuedInsights(trades).some((c) => !seenInsightKeys.includes(c.key));
  const onInsights = path.startsWith("/insights");
  useEffect(() => {
    document.querySelectorAll(".scroll").forEach((el) => {
      (el as HTMLElement).scrollTop = 0;
    });
  }, [path]);
  useEffect(() => {
    if (!onInsights) return;
    const keys = issuedInsights(trades).map((c) => c.key);
    if (keys.length) markInsightsSeen(keys);
  }, [onInsights, trades, markInsightsSeen]);
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

function HomeIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function PlanIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M9 2.5v3M15 2.5v3M8 11h8M8 15h5" />
    </svg>
  );
}
function RecordIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8}>
      <path d="M6 4h9l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M14 4v6h6M8 13h8M8 17h5" />
    </svg>
  );
}
function InsightIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.8}>
      <path d="M5 16V9M10 16V6M15 16v-4M20 16V8" />
    </svg>
  );
}

export function ChartMark() {
  return (
    <svg width="88" height="64" viewBox="0 0 88 64" fill="none">
      <rect x="8" y="12" width="72" height="40" rx="4" stroke="#c5d7f5" />
      <rect x="18" y="28" width="10" height="18" rx="2" fill="#2f9e6b" />
      <rect x="36" y="20" width="10" height="26" rx="2" fill="#e5484d" />
      <rect x="54" y="24" width="10" height="22" rx="2" fill="#3d6bff" />
    </svg>
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
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return <div className={`toast ${kind}`}>{message}</div>;
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
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  cancel?: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-back">
      <div className="modal">
        <h3>{title}</h3>
        <p>{body}</p>
        <button className="btn btn-primary" type="button" onClick={onConfirm} style={{ marginBottom: 8 }}>
          {confirm}
        </button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          {cancel}
        </button>
      </div>
    </div>
  );
}

export const LEGAL =
  "패턴노트는 투자자문업자 또는 유사투자자문업자가 아니며, 이용자가 입력한 기록을 계산해 지난 매매의 경향을 보여줍니다. 특정 종목의 매매를 권유하지 않으며, 투자 판단과 그 결과에 대한 책임은 이용자 본인에게 있습니다.";
