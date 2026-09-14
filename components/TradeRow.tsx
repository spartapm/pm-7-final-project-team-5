"use client";

import { useState } from "react";
import { formatMd, formatPrice, formatQty, sideLabel } from "@/lib/format";
import type { CategoryPick, Trade } from "@/lib/types";

export function ReadChips({ items }: { items: CategoryPick[] }) {
  if (!items.length) return <p className="keep">선택하지 않음</p>;
  return (
    <div className="chips-read">
      {items.map((item) => (
        <span key={item.label} className="chip read">
          {item.label}
        </span>
      ))}
    </div>
  );
}

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
  const compact = !showReason;
  return (
    <button className={`trade-card${compact ? " compact" : ""}`} type="button" onClick={onClick}>
      <div className="trade-card-top">
        <div className="trade-card-lead">
          <b>{trade.stockName}</b>
          <span className={trade.side === "buy" ? "badge" : "badge sell-badge"}>{sideLabel(trade.side)}</span>
        </div>
        <div className="trade-card-end">
          <span className="trade-date">{formatMd(trade.tradedAt)}</span>
          {compact ? (
            <p
              className={`trade-amt ${blurMoney && !open ? "blurred" : ""}`}
              onClick={(e) => {
                if (!blurMoney) return;
                e.stopPropagation();
                setOpen(true);
              }}
            >
              {formatPrice(trade.price, trade.market)}
            </p>
          ) : null}
        </div>
      </div>
      {!compact ? (
        <>
          <p className="trade-amt">
            {showQty ? `${formatQty(trade.qty)} · ` : ""}
            {formatPrice(trade.price, trade.market)}
          </p>
          <div className="trade-meta">
            <div className="kv-mini">
              <span>매매 이유</span>
              <ReadChips items={trade.reasons} />
            </div>
            <div className="kv-mini">
              <span>그때 마음</span>
              <ReadChips items={trade.moods} />
            </div>
          </div>
        </>
      ) : null}
    </button>
  );
}
