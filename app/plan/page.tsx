"use client";

import { useRouter } from "next/navigation";
import { ChartMark, PhoneShell, TabBar } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PlanListPage() {
  const router = useRouter();
  const { hydrated, plans } = useStore();
  if (!hydrated) return <div className="shell" />;

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
        {plans.length === 0 ? (
          <div className="empty hero">
            <div className="blob">
              <ChartMark />
            </div>
            <h3>오늘 매매 계획을 세워보세요!</h3>
            <p>희망 매수가·손절가·목표가를 미리 적어 두면 실제 매매와 비교할 수 있어요.</p>
            <button className="btn btn-primary" type="button" style={{ marginTop: 24 }} onClick={() => router.push("/plan/new")}>
              매매 계획 세우기
            </button>
          </div>
        ) : (
          plans.map((p) => (
            <button key={p.id} className="plan-row" type="button" onClick={() => router.push(`/plan/${p.id}`)}>
              <h3>{p.stockName}</h3>
              <div className="plan-nums">
                {p.market} · {p.stockCode}
                <br />
                희망 {p.targetBuy != null ? formatPrice(p.targetBuy, p.market) : "-"} · 손절{" "}
                {p.stopLoss != null ? formatPrice(p.stopLoss, p.market) : "-"} · 목표{" "}
                {p.takeProfit != null ? formatPrice(p.takeProfit, p.market) : "-"}
              </div>
              <span className="chev">›</span>
            </button>
          ))
        )}
      </div>
      <TabBar />
    </PhoneShell>
  );
}
