"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { TradeRow } from "@/components/TradeRow";
import { reasonChip } from "@/lib/insights";
import { useStore } from "@/lib/store";

function RelatedInner() {
  const params = useSearchParams();
  const id = params.get("id") || params.get("key") || "";
  const router = useRouter();
  const { hydrated, trades, issuedCards } = useStore();
  const card = issuedCards.find((c) => c.id === id);
  const related = card ? trades.filter((t) => card.relatedTradeIds.includes(t.id)) : [];

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          ‹
        </button>
        <h1 className="h1">관련 기록</h1>
        <button className="skip" type="button" onClick={() => router.push("/record")}>
          + 새 기록
        </button>
      </div>
      <div className="scroll">
        {card ? (
          <>
            <span className="badge">{reasonChip(card)}</span>
            <p className="sub">관련 기록을 매매일 최신순으로 보여 드려요.</p>
            {related.map((t) => (
              <div key={t.id} className="card" style={{ marginTop: 10 }}>
                <TradeRow trade={t} showQty showReason onClick={() => router.push(`/records/${t.id}`)} />
                <div className="sub stack-lines" style={{ marginTop: 8 }}>
                  <b>매매이유</b>
                  {t.reasons.map((r) => (
                    <span key={r.label}>
                      {r.group} · {r.label}
                    </span>
                  ))}
                  <b>그때 마음</b>
                  {t.moods.map((m) => (
                    <span key={m.label}>{m.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <p className="sub">연결된 인사이트를 찾을 수 없어요.</p>
        )}
      </div>
    </PhoneShell>
  );
}

export default function InsightRelatedPage() {
  return (
    <Suspense fallback={<div className="shell" />}>
      <RelatedInner />
    </Suspense>
  );
}
