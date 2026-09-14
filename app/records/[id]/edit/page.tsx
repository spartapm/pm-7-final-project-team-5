"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { TradeWizard } from "@/components/TradeWizard";
import { editSessionId, track } from "@/lib/analytics";
import { findStock } from "@/lib/stocks";
import { draftFromTrade, useStore } from "@/lib/store";
import type { DraftTrade, Stock } from "@/lib/types";

function stockOf(trade: { stockCode: string; stockName: string; market: string }): Stock {
  return (
    findStock(trade.stockCode, trade.market) || {
      code: trade.stockCode,
      name: trade.stockName,
      market: trade.market,
      marketName: trade.market,
    }
  );
}

export default function EditRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, trades, updateTrade } = useStore();
  const trade = trades.find((t) => t.id === id);
  const [draft, setDraft] = useState<DraftTrade | null>(null);

  if (!hydrated) return <div className="shell" />;
  if (!trade) {
    return (
      <PhoneShell>
        <div className="empty">
          <h3>기록을 찾을 수 없어요</h3>
          <button className="btn btn-ghost" type="button" onClick={() => router.replace("/records")}>
            목록으로
          </button>
        </div>
      </PhoneShell>
    );
  }

  const current = draft ?? draftFromTrade(trade, stockOf(trade));

  function changedFields(next: DraftTrade) {
    const fields: string[] = [];
    if (next.price.replace(/,/g, "") !== String(trade!.price)) fields.push("price");
    if (next.qty.replace(/,/g, "") !== String(trade!.qty)) fields.push("quantity");
    if (next.tradedAt !== trade!.tradedAt || next.tradedTime !== trade!.tradedTime) fields.push("trade_date");
    if (next.stock?.code !== trade!.stockCode) fields.push("stock_code");
    if (next.side !== trade!.side) fields.push("trade_type");
    return fields;
  }

  return (
    <PhoneShell>
      <TradeWizard
        draft={current}
        setDraft={(next) => setDraft(next)}
        mode="edit"
        savingLabel="저장하기"
        onClose={() => router.back()}
        onSave={() => {
          const saved = updateTrade(trade.id, current);
          const sid = editSessionId();
          if (saved) {
            track("record_edit_save_success", {
              record_id: trade.id,
              edit_session_id: sid,
              changed_fields: changedFields(current),
            });
            router.replace(`/records/${trade.id}`);
          } else {
            track("record_edit_save_error", {
              record_id: trade.id,
              edit_session_id: sid,
              error_code: "validation_error",
            });
          }
        }}
      />
    </PhoneShell>
  );
}
