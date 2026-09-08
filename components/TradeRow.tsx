"use client";

import { StockTile } from "@/components/icons";
import { formatPrice, formatQty, sideLabel } from "@/lib/format";
import type { Trade } from "@/lib/types";
import { useState } from "react";

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
    <button
      className="trade-row"
      type="button"
      onClick={onClick}
    >
      <StockTile name={trade.stockName} code={trade.stockCode} />
      <div>
        <div className="name">{trade.stockName}</div>
        <div className={trade.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(trade.side)}</div>
        {showReason && trade.reasons.length ? (
          <div className="meta stack-lines">
            {trade.reasons.map((r) => (
              <span key={r.label}>
                {r.group} · {r.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="right">
        <div
          className={`price ${blurMoney && !open ? "blurred" : ""}`}
          onClick={(e) => {
            if (!blurMoney) return;
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {formatPrice(trade.price, trade.market)}
          {showQty ? ` · ${formatQty(trade.qty)}` : ""}
        </div>
        <div className="meta">{trade.tradedAt.slice(5).replace("-", ".")}</div>
      </div>
    </button>
  );
}
