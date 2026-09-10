"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Chevron, StockTile } from "@/components/icons";
import { ChartMark, PhoneShell, TabBar } from "@/components/ui";
import { sideLabel } from "@/lib/format";
import { planSummary } from "@/lib/plans";
import { useStore } from "@/lib/store";

export default function PlanListPage() {
  const router = useRouter();
  const { hydrated, plans } = useStore();
  const [shown, setShown] = useState(10);
  const moreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = moreRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShown((n) => n + 10);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, hydrated, plans.length]);
  if (!hydrated) return <div className="shell" />;
  const sorted = [...plans].sort((a, b) => b.updatedAt - a.updatedAt);
  const visible = sorted.slice(0, shown);

  return (
    <PhoneShell>
      <div className="topbar">
        <h1 className="h1">계획</h1>
        {plans.length > 0 ? (
          <button className="skip" type="button" onClick={() => router.push("/plan/new")}>
            + 새 계획
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
            <p>
              미리 정해 둔 계획이 있다면 기록해 보세요
              <br />
              매매를 기록할 때 나란히 볼 수 있어요
            </p>
            <ul className="plan-guide">
              <li>매수 계획・이 가격대에서 사고 싶어요 (희망 매수가 구간)</li>
              <li>매도 계획・목표가와 손절가를 미리 정해 둘 수 있어요</li>
            </ul>
            <button className="btn btn-primary" type="button" style={{ marginTop: 24 }} onClick={() => router.push("/plan/new")}>
              첫 계획 등록하기
            </button>
          </div>
        ) : (
          <>
            <p className="sub">종목마다 매수 계획(희망 매수가 구간) · 매도 계획(목표가·손절가)을 따로 등록할 수 있어요</p>
            {visible.map((p) => (
              <button key={p.id} className="plan-row" type="button" onClick={() => router.push(`/plan/${p.id}`)}>
                <StockTile name={p.stockName} code={p.stockCode} />
                <div className="plan-row-main">
                  <div className="plan-row-top">
                    <h3>{p.stockName}</h3>
                    <span className={p.side === "buy" ? "badge" : "badge sell-badge"}>{sideLabel(p.side)} 계획</span>
                  </div>
                  <div className="plan-nums">{planSummary(p)}</div>
                </div>
                <Chevron />
              </button>
            ))}
            {shown < sorted.length ? <div ref={moreRef} style={{ height: 1 }} /> : null}
          </>
        )}
      </div>
      <TabBar />
    </PhoneShell>
  );
}
