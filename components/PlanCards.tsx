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
          stockName={trade.stockName}
          snap={snap!}
          market={trade.market}
          onHide={() => onHide(opposite)}
        />
      ) : null}
      {!oppSnap || hideOpp ? (
        <button className="induce-card" type="button" onClick={() => onInduce(opposite)}>
          <span className="induce-plus" aria-hidden>
            +
          </span>
          <span>
            <b>{opposite === "sell" ? "매도" : "매수"} 계획 등록하기</b>
            <small>이 종목에 대한 {opposite === "sell" ? "매도" : "매수"} 계획을 등록해 보세요</small>
          </span>
        </button>
      ) : null}
    </div>
  );
}

function CompareBuy({ trade, snap, onHide }: { trade: Trade; snap: { min: number; max: number }; onHide: () => void }) {
  const judge = buyCaption(trade.price, snap.min, snap.max);
  return (
    <div className="card plan-compare">
      <div className="plan-compare-head">
        <b>{trade.stockName} 매수 계획</b>
        <button className="x" type="button" onClick={onHide} aria-label="닫기">
          ✕
        </button>
      </div>
      <div className="plan-compare-kv">
        <span>희망 매수 구간</span>
        <b>
          {formatPrice(snap.min, trade.market)} ~ {formatPrice(snap.max, trade.market)}
        </b>
      </div>
      <div className="plan-compare-kv">
        <span>실제 매수가</span>
        <b>{formatPrice(trade.price, trade.market)}</b>
      </div>
      <div className="range-bar">
        <i style={{ left: `${Math.min(100, Math.max(0, judge.pct))}%` }} />
      </div>
      <p className="plan-compare-foot">{judge.caption}</p>
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
      <div className="plan-compare-head">
        <b>{trade.stockName} 매도 계획</b>
        <button className="x" type="button" onClick={onHide} aria-label="닫기">
          ✕
        </button>
      </div>
      <div className="plan-compare-kv">
        <span>손절가</span>
        <b>{formatPrice(snap.stopLoss, trade.market)}</b>
      </div>
      <div className="plan-compare-kv">
        <span>목표가</span>
        <b>{formatPrice(snap.takeProfit, trade.market)}</b>
      </div>
      <div className="plan-compare-kv">
        <span>실제 매도가</span>
        <b>{formatPrice(trade.price, trade.market)}</b>
      </div>
      <div className="range-bar">
        <i style={{ left: `${Math.min(100, Math.max(0, judge.pct))}%` }} />
      </div>
      <p className="plan-compare-foot">{judge.caption}</p>
    </div>
  );
}

function PreviewCard({
  side,
  stockName,
  snap,
  market,
  onHide,
}: {
  side: "buy" | "sell";
  stockName: string;
  snap: PlanSnapshot;
  market: string;
  onHide: () => void;
}) {
  return (
    <div className="card plan-compare">
      <div className="plan-compare-head">
        <b>
          {stockName} {side === "sell" ? "매도" : "매수"} 계획
        </b>
        <button className="x" type="button" onClick={onHide} aria-label="닫기">
          ✕
        </button>
      </div>
      {side === "buy" && snap.buy ? (
        <div className="plan-compare-kv">
          <span>희망 매수 구간</span>
          <b>
            {formatPrice(snap.buy.min, market)} ~ {formatPrice(snap.buy.max, market)}
          </b>
        </div>
      ) : snap.sell ? (
        <>
          <div className="plan-compare-kv">
            <span>손절가</span>
            <b>{formatPrice(snap.sell.stopLoss, market)}</b>
          </div>
          <div className="plan-compare-kv">
            <span>목표가</span>
            <b>{formatPrice(snap.sell.takeProfit, market)}</b>
          </div>
        </>
      ) : null}
      <p className="plan-compare-foot preview">{side === "sell" ? "다음 매도 시 참고돼요" : "다음 매수 시 참고돼요"}</p>
    </div>
  );
}
