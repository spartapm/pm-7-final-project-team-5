"use client";

import { useState } from "react";
import { formatMd, formatPrice, formatQty, sideLabel } from "@/lib/format";
import type { Trade } from "@/lib/types";

export function TradeRow({
  trade,
  onClick,
  showReason = false,
  showQty = false,
  blurMoney = false,
}: {
  trade: Trade;
  onClick: () => void;
  showReason?: boolean;
  showQty?: boolean;
  blurMoney?: boolean;
}) {
  const [open, setOpen] = useState(!blurMoney);
  return (
    <button className="trade-card" type="button" onClick={onClick}>
      <div className="trade-card-top">
        <b>{trade.stockName}</b>
        <span className={trade.side === "buy" ? "badge" : "badge sell-badge"}>{sideLabel(trade.side)}</span>
        <span className="trade-date">{formatMd(trade.tradedAt)}</span>
      </div>
      <p
        className={`trade-amt ${blurMoney && !open ? "blurred" : ""}`}
        onClick={(e) => {
          if (!blurMoney) return;
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {showQty ? `${formatQty(trade.qty)} · ` : ""}
        {formatPrice(trade.price, trade.market)}
      </p>
      {showReason ? (
        <div className="trade-meta">
          <div className="kv-mini">
            <span>매매 이유</span>
            <p className="stack-lines keep">
              {trade.reasons.length ? trade.reasons.map((r) => <span key={r.label}>{r.label}</span>) : "선택하지 않음"}
            </p>
          </div>
          <div className="kv-mini">
            <span>그때 마음</span>
            <p className="stack-lines keep">
              {trade.moods.length ? trade.moods.map((m) => <span key={m.label}>{m.label}</span>) : "선택하지 않음"}
            </p>
          </div>
        </div>
      ) : null}
    </button>
  );
}
