"use client";

import { insightHref, reasonChip } from "@/lib/insights";
import type { IssuedCard } from "@/lib/types";

export function InsightCard({ card }: { card: IssuedCard }) {
  return (
    <div className={`card insight-card accent ${card.side}`}>
      <span className={`badge ${card.side === "sell" ? "sell-badge" : ""}`}>{reasonChip(card)}</span>
      <h3>{card.narrative1}</h3>
      <p>{card.narrative2}</p>
      <a className="sub" href={insightHref(card.id)}>
        관련 기록 {card.count}건 →
      </a>
    </div>
  );
}
