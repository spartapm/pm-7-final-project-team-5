"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markInsightViewed, pairId, track } from "@/lib/analytics";
import { insightHref, reasonChip } from "@/lib/insights";
import type { IssuedCard } from "@/lib/types";

export function InsightCard({ card, surface = "insight_detail" }: { card: IssuedCard; surface?: string }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (sent.current) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          timer.current = window.setTimeout(() => {
            if (sent.current) return;
            sent.current = true;
            const { first } = markInsightViewed(card.id);
            track("insight_view", {
              insight_id: card.id,
              pair_id: pairId(card.side, card.reasonGroup, card.moodMeta),
              trade_type: card.side,
              pair_count: card.count,
              insight_type: "repeated_pair",
              is_first_insight_view: first,
              surface,
              screen_name: "insight_card",
            });
          }, 1000);
        } else if (timer.current) {
          window.clearTimeout(timer.current);
          timer.current = null;
        }
      },
      { threshold: [0.5] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [card, surface]);

  return (
    <div ref={ref} className={`card insight-card accent ${card.side}`}>
      <span className={`badge ${card.side === "sell" ? "sell-badge" : ""}`}>{reasonChip(card)}</span>
      <p className="narrative1 keep">{card.narrative1}</p>
      <p className="narrative2 keep">{card.narrative2}</p>
      <div className="insight-cta">
        <a
          className="sub"
          href={insightHref(card.id)}
          onClick={(e) => {
            e.preventDefault();
            track("insight_related_records_click", {
              insight_id: card.id,
              pair_id: pairId(card.side, card.reasonGroup, card.moodMeta),
              trade_type: card.side,
              related_record_count: card.relatedTradeIds.length,
            });
            router.push(insightHref(card.id));
          }}
        >
          관련 기록 모두보기
        </a>
      </div>
    </div>
  );
}
