"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { ChoiceSheet, Modal, PhoneShell } from "@/components/ui";
import { StockSearch } from "@/components/StockSearch";
import { TradeWizard } from "@/components/TradeWizard";
import { emptyDraft, useStore } from "@/lib/store";
import type { Side, Stock } from "@/lib/types";

export default function RecordPage() {
  const router = useRouter();
  const { loggedIn, addTrade } = useStore();
  const [stock, setStock] = useState<Stock | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft("buy", null, false));
  const [pickSide, setPickSide] = useState(false);
  const [gate, setGate] = useState(false);

  function start(side: Side, picked: Stock) {
    setDraft(emptyDraft(side, picked, false));
    setPickSide(false);
  }

  if (draft.stock) {
    return (
      <PhoneShell>
        <TradeWizard
          draft={draft}
          setDraft={setDraft}
          savingLabel="저장하기"
          onClose={() => setDraft(emptyDraft("buy", null, false))}
          onSave={() => {
            if (!loggedIn) {
              setGate(true);
              return;
            }
            const saved = addTrade(draft);
            if (saved) router.replace(`/records/${saved.id}`);
          }}
        />
        {gate ? (
          <Modal
            title="실제 기록을 남기려면 가입이 필요해요"
            body="연습은 비회원으로 가능하지만, 실제 매매 기록은 계정에 저장됩니다."
            confirm="회원가입"
            onConfirm={() => router.push("/signup")}
            onCancel={() => setGate(false)}
          />
        ) : null}
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">종목 검색</h1>
        <span />
      </div>
      <div className="scroll">
        <StockSearch
          selected={stock}
          onPick={(s) => {
            setStock(s);
            setPickSide(true);
          }}
        />
      </div>
      {pickSide && stock ? (
        <ChoiceSheet
          title="어떤 기록을 시작할까요?"
          left="매수 기록"
          right="매도 기록"
          onLeft={() => start("buy", stock)}
          onRight={() => start("sell", stock)}
          onClose={() => setPickSide(false)}
        />
      ) : null}
    </PhoneShell>
  );
}
