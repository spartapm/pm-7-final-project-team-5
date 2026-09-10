"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanCards } from "@/components/PlanCards";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice, formatQty, formatWhen, sideLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, trades, deleteTrade, hidePlanOnTrade } = useStore();
  const [askDelete, setAskDelete] = useState(false);
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
        <button className="icon-btn" type="button" onClick={() => router.back()}>
          ‹
        </button>
        <h1 className="h1">{trade.stockName}</h1>
        <button className="skip" type="button" onClick={() => setAskDelete(true)}>
          삭제
        </button>
      </div>
      <div className="scroll">
        <div className="card">
          <dl className="detail-kv">
            <dt>구분</dt>
            <dd className={trade.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(trade.side)}</dd>
            <dt>종목</dt>
            <dd>
              {trade.stockName} ({trade.stockCode})
            </dd>
            <dt>가격</dt>
            <dd>{formatPrice(trade.price, trade.market)}</dd>
            <dt>수량</dt>
            <dd>{formatQty(trade.qty)}</dd>
            <dt>일자</dt>
            <dd>{formatWhen(trade.tradedAt, trade.tradedTime)}</dd>
          </dl>
        </div>
        <div className="card">
          <b>매매 이유</b>
          <div className="chips-read stack">
            {trade.reasons.length ? (
              trade.reasons.map((r) => (
                <span key={r.label}>
                  {r.group} · {r.label}
                </span>
              ))
            ) : (
              <span className="sub">선택하지 않음</span>
            )}
          </div>
        </div>
        <div className="card">
          <b>그때 마음</b>
          <div className="chips-read stack">
            {trade.moods.length ? trade.moods.map((m) => <span key={m.label}>{m.label}</span>) : <span className="sub">선택하지 않음</span>}
          </div>
        </div>
        <PlanCards
          trade={trade}
          onHide={(side) => setHideSide(side)}
          onInduce={(side) =>
            router.push(`/plan/new?side=${side}&code=${trade.stockCode}&market=${trade.market}&return=${encodeURIComponent(`/records/${trade.id}`)}`)
          }
        />
      </div>
      <div className="footer-cta">
        <button className="btn btn-primary" type="button" onClick={() => router.push("/records")}>
          기록 목록 확인하기
        </button>
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
      {askDelete ? (
        <Modal
          title="이 기록을 삭제할까요?"
          body="삭제한 기록은 되돌릴 수 없어요. 이미 발행된 인사이트 카드는 그대로 남습니다."
          confirm="삭제"
          onCancel={() => setAskDelete(false)}
          onConfirm={() => {
            deleteTrade(trade.id);
            router.replace("/records");
          }}
        />
      ) : null}
    </PhoneShell>
  );
}
