"use client";

import { formatPrice } from "@/lib/format";
import { buyCaption, sellCaption } from "@/lib/plans";
import type { PlanSnapshot, Trade } from "@/lib/types";

export function PlanCards({
  trade,
  onHide,
  onInduce,
}: {
  trade: Trade;
  onHide: (side: "buy" | "sell") => void;
  onInduce: (side: "buy" | "sell") => void;
}) {
  const snap = trade.planSnapshot;
  const opposite: "buy" | "sell" = trade.side === "buy" ? "sell" : "buy";
  const sameSnap = trade.side === "buy" ? snap?.buy : snap?.sell;
  const oppSnap = opposite === "buy" ? snap?.buy : snap?.sell;
  const hideSame = trade.hiddenPlan[trade.side];
  const hideOpp = trade.hiddenPlan[opposite];

  return (
    <div style={{ marginTop: 12 }}>
      {sameSnap && !hideSame ? (
        trade.side === "buy" && snap?.buy ? (
          <CompareBuy trade={trade} snap={snap.buy} onHide={() => onHide("buy")} />
        ) : snap?.sell ? (
          <CompareSell trade={trade} snap={snap.sell} onHide={() => onHide("sell")} />
        ) : null
      ) : null}
      {oppSnap && !hideOpp ? (
        <PreviewCard
          side={opposite}
          snap={snap!}
          market={trade.market}
          onHide={() => onHide(opposite)}
        />
      ) : null}
      {!oppSnap || hideOpp ? (
        <button className="card induce" type="button" onClick={() => onInduce(opposite)}>
          + {opposite === "sell" ? "매도" : "매수"} 계획 등록하기
        </button>
      ) : null}
    </div>
  );
}

function CompareBuy({ trade, snap, onHide }: { trade: Trade; snap: { min: number; max: number }; onHide: () => void }) {
  const judge = buyCaption(trade.price, snap.min, snap.max);
  return (
    <div className="card plan-compare" onClick={(e) => e.preventDefault()}>
      <button className="x" type="button" onClick={onHide}>
        ✕
      </button>
      <b>매수 계획 대조</b>
      <p className="sub">{judge.caption}</p>
      {judge.inRange ? (
        <div className="range-bar">
          <i style={{ left: `${Math.min(100, Math.max(0, judge.pct))}%` }} />
        </div>
      ) : null}
      <p className="sub">
        희망 {formatPrice(snap.min, trade.market)} ~ {formatPrice(snap.max, trade.market)}
      </p>
    </div>
  );
}

function CompareSell({
  trade,
  snap,
  onHide,
}: {
  trade: Trade;
  snap: { stopLoss: number; takeProfit: number };
  onHide: () => void;
}) {
  const judge = sellCaption(trade.price, snap.stopLoss, snap.takeProfit);
  return (
    <div className="card plan-compare">
      <button className="x" type="button" onClick={onHide}>
        ✕
      </button>
      <b>매도 계획 대조</b>
      <p className="sub">{judge.caption}</p>
      {judge.inRange ? (
        <div className="range-bar">
          <i style={{ left: `${Math.min(100, Math.max(0, judge.pct))}%` }} />
        </div>
      ) : null}
      <p className="sub">
        손절 {formatPrice(snap.stopLoss, trade.market)} · 목표 {formatPrice(snap.takeProfit, trade.market)}
      </p>
    </div>
  );
}

function PreviewCard({
  side,
  snap,
  market,
  onHide,
}: {
  side: "buy" | "sell";
  snap: PlanSnapshot;
  market: string;
  onHide: () => void;
}) {
  return (
    <div className="card plan-compare">
      <button className="x" type="button" onClick={onHide}>
        ✕
      </button>
      <b>{side === "sell" ? "매도 시 참고돼요" : "다음 매수 시 참고돼요"}</b>
      {side === "buy" && snap.buy ? (
        <p className="sub">
          희망 {formatPrice(snap.buy.min, market)} ~ {formatPrice(snap.buy.max, market)}
        </p>
      ) : snap.sell ? (
        <p className="sub">
          손절 {formatPrice(snap.sell.stopLoss, market)} · 목표 {formatPrice(snap.sell.takeProfit, market)}
        </p>
      ) : null}
    </div>
  );
}
