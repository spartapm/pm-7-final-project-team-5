"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell, TabBar } from "@/components/ui";
import { TradeRow } from "@/components/TradeRow";
import { startRecordSession, track, trackOnce } from "@/lib/analytics";
import { useStore } from "@/lib/store";
import type { Side } from "@/lib/types";

export default function RecordsPage() {
  const router = useRouter();
  const { hydrated, trades } = useStore();
  const [filter, setFilter] = useState<"all" | Side>("all");
  const [filterReady, setFilterReady] = useState(false);
  useEffect(() => {
    const saved = sessionStorage.getItem("inplot:records-filter");
    if (saved === "buy" || saved === "sell" || saved === "all") setFilter(saved);
    setFilterReady(true);
  }, []);
  const list = useMemo(() => {
    const real = trades.filter((t) => !t.isPractice).sort((a, b) => (a.tradedAt < b.tradedAt ? 1 : a.tradedAt > b.tradedAt ? -1 : b.createdAt - a.createdAt));
    if (filter === "all") return real;
    return real.filter((t) => t.side === filter);
  }, [trades, filter]);

  useEffect(() => {
    if (!hydrated || !filterReady) return;
    trackOnce("record_list_view", "record_list_view", {
      item_count: list.length,
      sort_type: "record_date_desc",
      filter_applied: filter !== "all",
      list_state: list.length === 0 ? "empty" : "populated",
      screen_id: "5-1",
      screen_name: "record_list",
    });
  }, [hydrated, filterReady, filter, list.length]);

  function setFilterPersist(next: "all" | Side) {
    setFilter(next);
    sessionStorage.setItem("inplot:records-filter", next);
  }

  if (!hydrated) return <div className="shell" />;
  const realCount = trades.filter((t) => !t.isPractice).length;

  return (
    <PhoneShell>
      <div className="topbar">
        <h1 className="h1 list-title">기록</h1>
        <button
          className="new-pill"
          type="button"
          onClick={() => {
            startRecordSession("record_list", realCount);
            router.push("/record");
          }}
        >
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
          list.map((t, i) => (
            <TradeRow
              key={t.id}
              trade={t}
              showQty
              showReason
              onClick={() => {
                track("record_item_click", {
                  row_index: i,
                  entry_source: "record_list",
                  screen_id: "5-1",
                  screen_name: "record_list",
                });
                router.push(`/records/${t.id}?src=record_list`);
              }}
            />
          ))
        )}
      </div>
      <TabBar />
    </PhoneShell>
  );
}
