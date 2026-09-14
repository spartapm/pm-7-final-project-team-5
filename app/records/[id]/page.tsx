"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { BackChevron } from "@/components/icons";
import { PlanCards } from "@/components/PlanCards";
import { ReadChips } from "@/components/TradeRow";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice, formatQty } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, trades, hidePlanOnTrade } = useStore();
  const [hideSide, setHideSide] = useState<"buy" | "sell" | null>(null);
  const trade = trades.find((t) => t.id === id);

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

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          <BackChevron />
        </button>
        <h1 className="h1">기록 상세</h1>
        <span />
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
            <dt>매매일시</dt>
            <dd>
              {trade.tradedAt}
              {trade.tradedTime ? ` ${trade.tradedTime}` : ""}
            </dd>
          </dl>
        </div>
        <div className="fact-card">
          <b>매매 이유</b>
          <ReadChips items={trade.reasons} />
        </div>
        <div className="fact-card">
          <b>그때 마음</b>
          <ReadChips items={trade.moods} />
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
