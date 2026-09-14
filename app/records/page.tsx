"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell, TabBar } from "@/components/ui";
import { TradeRow } from "@/components/TradeRow";
import { useStore } from "@/lib/store";
import type { Side } from "@/lib/types";

export default function RecordsPage() {
  const router = useRouter();
  const { hydrated, trades } = useStore();
  const [filter, setFilter] = useState<"all" | Side>("all");
  useEffect(() => {
    const saved = sessionStorage.getItem("inplot:records-filter");
    if (saved === "buy" || saved === "sell" || saved === "all") setFilter(saved);
  }, []);
  const list = useMemo(() => {
    const real = trades.filter((t) => !t.isPractice).sort((a, b) => (a.tradedAt < b.tradedAt ? 1 : a.tradedAt > b.tradedAt ? -1 : b.createdAt - a.createdAt));
    if (filter === "all") return real;
    return real.filter((t) => t.side === filter);
  }, [trades, filter]);

  function setFilterPersist(next: "all" | Side) {
    setFilter(next);
    sessionStorage.setItem("inplot:records-filter", next);
  }

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="topbar">
        <h1 className="h1 list-title">기록</h1>
        <button className="new-pill" type="button" onClick={() => router.push("/record")}>
          + 새 기록
        </button>
      </div>
      <div className="scroll tabbed">
        <div className="seg seg-3">
          {([
            ["all", "전체"],
            ["buy", "매수"],
            ["sell", "매도"],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilterPersist(k)}>
              {label}
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="empty compact">
            <h3>표시할 기록이 없어요</h3>
            <p>매수·매도를 각각 독립된 기록으로 남길 수 있어요.</p>
          </div>
        ) : (
          list.map((t) => (
            <TradeRow key={t.id} trade={t} showQty showReason onClick={() => router.push(`/records/${t.id}`)} />
          ))
        )}
      </div>
      <TabBar />
    </PhoneShell>
  );
}
