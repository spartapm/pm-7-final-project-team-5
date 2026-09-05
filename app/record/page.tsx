"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PhoneShell } from "@/components/ui";
import { TradeWizard } from "@/components/TradeWizard";
import { emptyDraft, useStore } from "@/lib/store";
import type { Side } from "@/lib/types";

export default function RecordPage() {
  const router = useRouter();
  const { loggedIn, plans, addTrade } = useStore();
  const [side, setSide] = useState<Side | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft("buy", null, false));
  const [gate, setGate] = useState(false);

  function pickSide(next: Side) {
    setSide(next);
    setDraft(emptyDraft(next, null, false));
  }

  if (!side) {
    return (
      <PhoneShell>
        <div className="topbar">
          <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
            ‹
          </button>
          <h1 className="h1">매매 기록</h1>
          <span />
        </div>
        <div className="scroll">
          <h1 className="step-title">어떤 매매를 남길까요?</h1>
          <p className="sub">매수와 매도는 각각 따로 기록해요.</p>
          <button className="side-pick buy" type="button" onClick={() => pickSide("buy")}>
            <b>매수 기록</b>
            <span>산 이유와 당시 상태를 남겨요</span>
          </button>
          <button className="side-pick sell" type="button" onClick={() => pickSide("sell")}>
            <b>매도 기록</b>
            <span>판 이유와 당시 상태를 남겨요</span>
          </button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <TradeWizard
        draft={draft}
        setDraft={setDraft}
        plans={plans}
        savingLabel="기록 저장"
        onClose={() => setSide(null)}
        onSave={() => {
          if (!loggedIn) {
            setGate(true);
            return;
          }
          addTrade(draft);
          router.replace("/home");
        }}
      />
      {gate ? (
        <Modal
          title="실제 기록을 남기려면 가입이 필요해요"
          body="연습은 비회원으로 가능하지만, 실제 매매 기록은 계정에 저장됩니다."
          confirm="카카오로 시작하기"
          onConfirm={() => router.push("/login")}
          onCancel={() => setGate(false)}
        />
      ) : null}
    </PhoneShell>
  );
}
