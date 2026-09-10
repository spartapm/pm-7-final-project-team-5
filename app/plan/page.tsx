"use client";

import { useRouter } from "next/navigation";
import { Chevron, StockTile } from "@/components/icons";
import { ChartMark, PhoneShell, TabBar } from "@/components/ui";
import { sideLabel } from "@/lib/format";
import { planSummary } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function PlanListPage() {
  const router = useRouter();
  const { hydrated, plans } = useStore();
  if (!hydrated) return <div className="shell" />;
  const sorted = [...plans].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <PhoneShell>
      <div className="topbar">
        <h1 className="h1">계획</h1>
        {plans.length > 0 ? (
          <button className="skip" type="button" onClick={() => router.push("/plan/new")}>
            새 계획
          </button>
        ) : (
          <span />
        )}
      </div>
      <div className="scroll tabbed">
        {sorted.length === 0 ? (
          <div className="empty hero">
            <div className="blob">
              <ChartMark />
            </div>
            <h3>아직 등록한 계획이 없어요</h3>
            <p>미리 정해 둔 계획이 있다면 기록해 보세요 · 매매를 기록할 때 나란히 볼 수 있어요</p>
            <ul className="plan-guide">
              <li>매수 계획 — 희망 매수 구간</li>
              <li>매도 계획 — 목표가와 손절가</li>
            </ul>
            <button className="btn btn-primary" type="button" style={{ marginTop: 24 }} onClick={() => router.push("/plan/new")}>
              새 계획
            </button>
          </div>
        ) : (
          <>
            <p className="sub">종목마다 매수 계획·매도 계획을 따로 등록할 수 있어요</p>
            {sorted.map((p) => (
              <button key={p.id} className="plan-row" type="button" onClick={() => router.push(`/plan/${p.id}`)}>
                <StockTile name={p.stockName} code={p.stockCode} />
                <div>
                  <h3>{p.stockName}</h3>
                  <div className="plan-nums">
                    <span className={p.side === "buy" ? "badge" : "badge sell-badge"}>{sideLabel(p.side)}</span> {planSummary(p)}
                  </div>
                </div>
                <Chevron />
              </button>
            ))}
          </>
        )}
      </div>
      <TabBar />
    </PhoneShell>
  );
}
