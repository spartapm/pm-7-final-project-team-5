"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BackChevron, PencilIco } from "@/components/icons";
import { PlanCards } from "@/components/PlanCards";
import { ReadChips } from "@/components/TradeRow";
import { Modal, PhoneShell } from "@/components/ui";
import { startEditSession, startPlanSession, track, trackOnce } from "@/lib/analytics";
import { formatPrice, formatQty, sideLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

function RecordDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { hydrated, trades, hidePlanOnTrade } = useStore();
  const [hideSide, setHideSide] = useState<"buy" | "sell" | null>(null);
  const trade = trades.find((t) => t.id === id);
  const src = params.get("src") === "insight_related_list" ? "insight_related_list" : "record_list";
  const insightId = params.get("insight") || undefined;

  useEffect(() => {
    if (!hydrated || !trade) return;
    trackOnce(`record_detail_view:${trade.id}`, "record_detail_view", {
      record_id: trade.id,
      trade_type: trade.side,
      detail_source: src,
      insight_id: insightId,
      screen_id: "5-3",
      screen_name: "record_detail",
    });
    const same = trade.side === "buy" ? trade.planSnapshot?.buy : trade.planSnapshot?.sell;
    if (same && !trade.hiddenPlan[trade.side]) {
      trackOnce(`plan_compare_view:${trade.id}`, "plan_compare_view", {
        plan_id: trade.planId,
        record_id: trade.id,
        snapshot_id: `${trade.id}_snap`,
        compare_source: "record_detail",
        snapshot_exists: true,
        screen_name: "record_detail",
      });
    }
  }, [hydrated, trade, src, insightId]);

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
        <button
          className="icon-btn"
          type="button"
          aria-label="매매정보 수정"
          onClick={() => {
            const sid = startEditSession();
            track("record_edit_start", {
              record_id: trade.id,
              trade_type: trade.side,
              edit_session_id: sid,
              screen_name: "record_detail",
            });
            router.push(`/records/${trade.id}/edit`);
          }}
        >
          <PencilIco />
        </button>
      </div>
      <div className="scroll">
        <div className="card">
          <b className="detail-block-title">매매 정보</b>
          <dl className="detail-kv">
            <dt>구분</dt>
            <dd className={trade.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(trade.side)}</dd>
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
          <ReadChips items={trade.reasons} />
        </div>
        <div className="fact-card">
          <b>그때 마음</b>
          <ReadChips items={trade.moods} />
        </div>
        <PlanCards
          trade={trade}
          onHide={(side) => setHideSide(side)}
          onInduce={(side) => {
            startPlanSession("record_detail", trade.stockCode);
            router.push(
              `/plan/new?side=${side}&code=${encodeURIComponent(trade.stockCode)}&market=${encodeURIComponent(trade.market)}&name=${encodeURIComponent(trade.stockName)}&return=${encodeURIComponent(`/records/${trade.id}`)}`
            );
          }}
        />
      </div>
      <div className="footer-cta">
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => {
            track("record_detail_list_cta_click", {
              record_id: trade.id,
              trade_type: trade.side,
              detail_source: src,
            });
            router.push("/records");
          }}
        >
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
    </PhoneShell>
  );
}

export default function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="shell" />}>
      <RecordDetailInner id={id} />
    </Suspense>
  );
}
