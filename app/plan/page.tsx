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
            등록
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
            <h3>오늘 매매 계획을 세워보세요!</h3>
            <p>매수 희망 구간이나 매도 목표가·손절가를 미리 적어 두면 실제 매매와 비교할 수 있어요.</p>
            <button className="btn btn-primary" type="button" style={{ marginTop: 24 }} onClick={() => router.push("/plan/new")}>
              매매 계획 세우기
            </button>
          </div>
        ) : (
          <>
            <p className="sub">종목·유형 조합당 계획 1개만 유지돼요.</p>
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
