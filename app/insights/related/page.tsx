"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneShell } from "@/components/ui";
import { formatPrice, initials, sideLabel } from "@/lib/format";
import { INSIGHT_THRESHOLD, summarizeInsights } from "@/lib/insights";
import { useStore } from "@/lib/store";

function RelatedInner() {
  const params = useSearchParams();
  const key = params.get("key") || "";
  const router = useRouter();
  const { hydrated, trades, insightCopy } = useStore();
  const summary = summarizeInsights(trades);
  const combo = summary.combos.find((c) => c.key === key);
  const related = combo ? summary.realTrades.filter((t) => combo.tradeIds.includes(t.id)) : [];
  const copy = insightCopy[key];

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="topbar">
        <button className="icon-btn" type="button" onClick={() => router.back()} aria-label="뒤로">
          ‹
        </button>
        <h1 className="h1">관련 기록</h1>
        <span />
      </div>
      <div className="scroll">
        {!combo ? (
          <div className="empty compact">
            <h3>인사이트를 찾을 수 없어요</h3>
            <p>기록이 바뀌었거나 아직 카드가 발행되지 않았어요.</p>
            <Link href="/insights" className="btn btn-ghost" style={{ marginTop: 16 }}>
              인사이트로
            </Link>
          </div>
        ) : (
          <>
            <div className="card insight-card">
              <span className="badge">
                {sideLabel(combo.side)} · {combo.count}건 반복
              </span>
              <h3>{copy?.observation ?? combo.observation}</h3>
              <p>{copy?.interpretation ?? combo.interpretation}</p>
              <p className="sub" style={{ marginTop: 8 }}>
                최근 {summary.realTrades.length}건 중 {combo.count}건
                {combo.count < INSIGHT_THRESHOLD ? ` · ${INSIGHT_THRESHOLD}건부터 카드 발행` : ""}
              </p>
            </div>
            <div className="section-head">
              <h2>이 조합의 기록</h2>
            </div>
            {related.length === 0 ? (
              <p className="sub">연결된 기록이 없어요.</p>
            ) : (
              related.map((t) => (
                <button key={t.id} className="trade-row" type="button" onClick={() => router.push(`/records/${t.id}`)}>
                  <div className={`avatar ${t.side}`}>{initials(t.stockName)}</div>
                  <div>
                    <div className="name">{t.stockName}</div>
                    <div className={t.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(t.side)}</div>
                  </div>
                  <div className="right">
                    <div className="price">{formatPrice(t.price, t.market)}</div>
                    <div className="meta">{t.tradedAt.slice(5).replace("-", ".")}</div>
                  </div>
                  <span className="chev">›</span>
                </button>
              ))
            )}
          </>
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
