"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { BackChevron, PencilIco } from "@/components/icons";
import { PlanCards } from "@/components/PlanCards";
import { TradeWizard } from "@/components/TradeWizard";
import { Modal, PhoneShell } from "@/components/ui";
import { formatPrice, formatQty, formatWhen, sideLabel } from "@/lib/format";
import { findStock } from "@/lib/stocks";
import { draftFromTrade, useStore } from "@/lib/store";

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { hydrated, trades, deleteTrade, hidePlanOnTrade, updateTrade } = useStore();
  const [askDelete, setAskDelete] = useState(false);
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
          <div className="section-head" style={{ marginTop: 0 }}>
            <b>매매 정보</b>
          </div>
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
        <button className="skip" type="button" onClick={() => setAskDelete(true)} style={{ display: "block", margin: "8px auto 0" }}>
          기록 삭제
        </button>
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
