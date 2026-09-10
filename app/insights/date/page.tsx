"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { InsightCard } from "@/components/InsightCard";
import { useStore } from "@/lib/store";

function DateInner() {
  const params = useSearchParams();
  const date = params.get("date") || "";
  const router = useRouter();
  const { hydrated, issuedCards } = useStore();
  const cards = issuedCards.filter((c) => c.dateKey === date).sort((a, b) => b.issuedAt - a.issuedAt);

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          ‹
        </button>
        <h1 className="h1">{date} 발행 카드 전체보기</h1>
        <span />
      </div>
      <div className="scroll">
        <p className="sub">발행시간 최신순 정렬</p>
        {cards.map((c) => (
          <InsightCard key={c.id} card={c} />
        ))}
        <p className="sub" style={{ marginTop: 16 }}>
          카드 내용은 발행 당시 그대로 보존돼요. 메인 화면(경향해석 탭)에는 매수·매도 슬롯당 최신 카드 1장만 노출돼요.
        </p>
      </div>
    </PhoneShell>
  );
}

export default function InsightDatePage() {
  return (
    <Suspense fallback={<div className="shell" />}>
      <DateInner />
    </Suspense>
  );
}
