"use client";

import { insightHref, reasonChip } from "@/lib/insights";
import type { IssuedCard } from "@/lib/types";

export function InsightCard({ card }: { card: IssuedCard }) {
  return (
    <div className={`card insight-card accent ${card.side}`}>
      <span className={`badge ${card.side === "sell" ? "sell-badge" : ""}`}>{reasonChip(card)}</span>
      <p className="narrative1 keep">{card.narrative1}</p>
      <p className="narrative2 keep">{card.narrative2}</p>
      <div className="insight-cta">
        <a className="sub" href={insightHref(card.id)}>
          관련 기록 모두보기
        </a>
      </div>
    </div>
  );
}
