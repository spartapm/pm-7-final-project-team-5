"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell, TabBar } from "@/components/ui";
import { formatPrice, initials, sideLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Side } from "@/lib/types";

export default function RecordsPage() {
  const router = useRouter();
  const { hydrated, trades } = useStore();
  const [filter, setFilter] = useState<"all" | Side>("all");
  const list = useMemo(() => {
    const real = trades.filter((t) => !t.isPractice);
    if (filter === "all") return real;
    return real.filter((t) => t.side === filter);
  }, [trades, filter]);

  if (!hydrated) return <div className="shell" />;

  return (
    <PhoneShell>
      <div className="topbar">
        <h1 className="h1">기록 확인</h1>
        <button className="skip" type="button" onClick={() => router.push("/record")}>기록하기</button>
      </div>
      <div className="scroll tabbed">
        <div className="seg seg-3">
          {([
            ["all", "전체"],
            ["buy", "매수"],
            ["sell", "매도"],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
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
            <button key={t.id} className="trade-row" type="button" onClick={() => router.push(`/records/${t.id}`)}>
              <div className={`avatar ${t.side}`}>{initials(t.stockName)}</div>
              <div>
                <div className="name">{t.stockName}</div>
                <div className={t.side === "buy" ? "side-buy" : "side-sell"}>{sideLabel(t.side)}</div>
              </div>
              <div className="right">
                <div className="price">{formatPrice(t.price, t.market)}</div>
                <div className="meta">{t.tradedAt}{t.tradedTime ? ` · ${t.tradedTime}` : ""}</div>
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
