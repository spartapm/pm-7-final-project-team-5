"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { TradeRow } from "@/components/TradeRow";
import { reasonChip } from "@/lib/insights";
import { useStore } from "@/lib/store";
import type { CategoryPick } from "@/lib/types";

function groupReasons(reasons: CategoryPick[]) {
  const map = new Map<string, string[]>();
  for (const r of reasons) {
    const key = r.group || "기타";
    const arr = map.get(key) || [];
    arr.push(r.label);
    map.set(key, arr);
  }
  return [...map.entries()].map(([group, labels]) => `${group} · ${labels.join(" · ")}`);
}

function RelatedInner() {
  const params = useSearchParams();
  const id = params.get("id") || params.get("key") || "";
  const router = useRouter();
  const { hydrated, trades, issuedCards } = useStore();
  const card = issuedCards.find((c) => c.id === id);
  const related = card
    ? trades.filter((t) => card.relatedTradeIds.includes(t.id)).sort((a, b) => (a.tradedAt < b.tradedAt ? 1 : a.tradedAt > b.tradedAt ? -1 : b.createdAt - a.createdAt))
    : [];

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          ‹
        </button>
        <h1 className="h1">기록</h1>
        <button className="skip" type="button" onClick={() => router.push("/record")}>
          + 새 기록
        </button>
      </div>
      <div className="scroll">
        {card ? (
          <>
            <span className="badge">{reasonChip(card)}</span>
            <p className="sub">기록일시 최신순 정렬</p>
            {related.map((t) => (
              <div key={t.id} className="card" style={{ marginTop: 10 }}>
                <TradeRow trade={t} showQty showReason onClick={() => router.push(`/records/${t.id}`)} />
                <div className="sub stack-lines" style={{ marginTop: 8 }}>
                  <b>매매이유</b>
                  {groupReasons(t.reasons).map((line) => (
                    <span key={line}>{line}</span>
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
