"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice, formatQty, formatWhen, sideLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, trades, plans, deleteTrade } = useStore();
  const [askDelete, setAskDelete] = useState(false);
  const trade = trades.find((t) => t.id === id);
  const plan = trade?.planId ? plans.find((p) => p.id === trade.planId) : null;

  if (!hydrated) return <div className="shell" />;

  if (!trade) {
    return (
      <PhoneShell>
        <div className="empty">
          <h3>기록을 찾을 수 없어요</h3>
          <button className="btn btn-ghost" type="button" onClick={() => router.replace("/records")}>목록으로</button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()}>‹</button>
        <h1 className="h1">{trade.stockName}</h1>
        <button className="skip" type="button" onClick={() => setAskDelete(true)}>삭제</button>
      </div>
      <div className="scroll">
        <div className="card">
          <dl className="detail-kv">
            <dt>구분</dt><dd className={trade.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(trade.side)}</dd>
            <dt>종목</dt><dd>{trade.stockName} ({trade.stockCode})</dd>
            <dt>시장</dt><dd>{trade.market}</dd>
            <dt>가격</dt><dd>{formatPrice(trade.price, trade.market)}</dd>
            <dt>수량</dt><dd>{formatQty(trade.qty)}</dd>
            <dt>일자</dt><dd>{formatWhen(trade.tradedAt, trade.tradedTime)}</dd>
            {plan ? <><dt>계획</dt><dd>희망 {plan.targetBuy ?? "-"} / 손절 {plan.stopLoss ?? "-"} / 목표 {plan.takeProfit ?? "-"}</dd></> : null}
          </dl>
        </div>
        <div className="card">
          <b>판단 근거</b>
          <div className="chips-read">
            {trade.reasons.length ? trade.reasons.map((r) => <span className="chip" key={r.label}>{r.label}</span>) : <span className="sub">선택하지 않음</span>}
          </div>
        </div>
        <div className="card">
          <b>당시 상태</b>
          <div className="chips-read">
            {trade.moods.length ? trade.moods.map((m) => <span className="chip" key={m.label}>{m.label}</span>) : <span className="sub">선택하지 않음</span>}
          </div>
        </div>
      </div>
      {askDelete ? (
        <Modal
          title="이 기록을 삭제할까요?"
          body="삭제한 기록은 되돌릴 수 없어요. 인사이트 집계에서도 빠집니다."
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
