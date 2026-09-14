"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { BackChevron, PencilIco } from "@/components/icons";
import { PlanCards } from "@/components/PlanCards";
import { TradeWizard } from "@/components/TradeWizard";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice, formatQty } from "@/lib/format";
import { findStock } from "@/lib/stocks";
import { draftFromTrade, useStore } from "@/lib/store";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, trades, hidePlanOnTrade, updateTrade } = useStore();
  const [hideSide, setHideSide] = useState<"buy" | "sell" | null>(null);
  const [editing, setEditing] = useState(false);
  const trade = trades.find((t) => t.id === id);
  const [draft, setDraft] = useState<ReturnType<typeof draftFromTrade> | null>(null);

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

  if (editing && draft) {
    return (
      <PhoneShell>
        <TradeWizard
          mode="edit"
          draft={draft}
          setDraft={setDraft}
          savingLabel="저장하기"
          onClose={() => setEditing(false)}
          onSave={() => {
            const saved = updateTrade(trade.id, draft);
            if (saved) setEditing(false);
          }}
        />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">기록 상세</h1>
        <button
          className="icon-btn"
          type="button"
          aria-label="수정"
          onClick={() => {
            const found = findStock(trade.stockCode, trade.market);
            const stock = found || {
              code: trade.stockCode,
              name: trade.stockName,
              market: trade.market,
              marketName: trade.market,
            };
            setDraft(draftFromTrade(trade, stock));
            setEditing(true);
          }}
        >
          <PencilIco />
        </button>
      </div>
      <div className="scroll">
        <div className="card">
          <dl className="detail-kv">
            <dt>종목</dt>
            <dd>{trade.stockName}</dd>
            <dt>수량 · {trade.side === "sell" ? "매도가" : "매수가"}</dt>
            <dd>
              {formatQty(trade.qty)} · {formatPrice(trade.price, trade.market)}
            </dd>
            <dt>{trade.side === "sell" ? "매도일시" : "매수일시"}</dt>
            <dd>
              {trade.tradedAt}
              {trade.tradedTime ? ` ${trade.tradedTime}` : ""}
            </dd>
          </dl>
        </div>
        <div className="fact-card">
          <b>매매 이유</b>
          <p className="keep">
            {trade.reasons.length
              ? groupedPicks(trade.reasons)
                  .map((g) => `${g.group}・${g.labels.join("・")}`)
                  .join(" ")
              : "선택하지 않음"}
          </p>
        </div>
        <div className="fact-card">
          <b>그때 마음</b>
          <p className="keep">{trade.moods.length ? trade.moods.map((m) => m.label).join("・") : "선택하지 않음"}</p>
        </div>
        <PlanCards
          trade={trade}
          onHide={(side) => setHideSide(side)}
          onInduce={(side) =>
            router.push(
              `/plan/new?side=${side}&code=${encodeURIComponent(trade.stockCode)}&market=${encodeURIComponent(trade.market)}&name=${encodeURIComponent(trade.stockName)}&return=${encodeURIComponent(`/records/${trade.id}`)}`
            )
          }
        />
      </div>
      {hideSide ? (
        <Modal
          title="이 계획을 기록에서 삭제하시겠어요?"
          body="계획 목록은 그대로 유지돼요"
          confirm="네"
          onCancel={() => setHideSide(null)}
          onConfirm={() => {
            hidePlanOnTrade(trade.id, hideSide);
            setHideSide(null);
          }}
        />
      ) : null}
    </PhoneShell>
  );
}

function groupedPicks(items: { group: string | null; label: string }[]) {
  const order: string[] = [];
  const map = new Map<string, string[]>();
  items.forEach((item) => {
    const group = item.group || "기타";
    if (!map.has(group)) {
      order.push(group);
      map.set(group, []);
    }
    map.get(group)!.push(item.label);
  });
  return order.map((group) => ({ group, labels: map.get(group) || [] }));
}
