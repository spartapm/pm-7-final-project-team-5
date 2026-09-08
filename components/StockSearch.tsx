"use client";

import { useMemo, useState } from "react";
import { isKorea, isOverseas } from "@/lib/markets";
import { searchStocks, type StockRegion } from "@/lib/stocks";
import { useStore } from "@/lib/store";
import type { Stock } from "@/lib/types";

const REGIONS: { id: StockRegion; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "kr", label: "국내" },
  { id: "us", label: "해외" },
];

function inRegion(s: Stock, region: StockRegion) {
  if (region === "kr") return isKorea(s.market);
  if (region === "us") return isOverseas(s.market);
  return true;
}

export function StockSearch({
  onPick,
  heading,
  emptyText,
  selected,
}: {
  onPick: (stock: Stock) => void;
  heading?: string;
  emptyText?: string;
  selected?: Stock | null;
}) {
  const { recentSearches, rememberSearch } = useStore();
  const [q, setQ] = useState("");
  const [region, setRegion] = useState<StockRegion>("all");
  const results = useMemo(() => searchStocks(q, 20, region), [q, region]);
  const recents = recentSearches.filter((s) => inRegion(s, region)).slice(0, 5);

  function pick(stock: Stock) {
    rememberSearch(stock);
    onPick(stock);
  }

  return (
    <>
      {heading ? <p className="sub">{heading}</p> : null}
      <div className="seg seg-3" style={{ marginTop: 16 }}>
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={region === r.id ? "on" : ""}
            onClick={() => setRegion(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="field">
        <div className="search-wrap">
          <SearchIcon />
          <input
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="종목명을 입력하세요"
          />
        </div>
      </div>
      {!q && recents.length > 0 ? (
        <>
          <div className="section-head">
            <h2>최근 검색</h2>
          </div>
          {recents.map((s) => (
            <StockRow key={`recent-${s.market}-${s.code}`} stock={s} onPick={pick} selected={selected} />
          ))}
        </>
      ) : null}
      {q ? (
        <>
          <div className="section-head">
            <h2>검색 결과</h2>
          </div>
          {results.length === 0 ? (
            <p className="sub">{emptyText ?? "맞는 종목이 없어요. 코드나 이름을 다시 입력해 주세요."}</p>
          ) : (
            results.map((s) => <StockRow key={`${s.market}-${s.code}`} stock={s} onPick={pick} selected={selected} />)
          )}
        </>
      ) : recents.length === 0 ? (
        <p className="sub">종목명을 입력해 검색해 주세요.</p>
      ) : null}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

function StockRow({ stock, onPick, selected }: { stock: Stock; onPick: (s: Stock) => void; selected?: Stock | null }) {
  const overseas = isOverseas(stock.market);
  const on = selected?.code === stock.code && selected?.market === stock.market;
  return (
    <button className={`search-item ${on ? "on" : ""}`} type="button" onClick={() => onPick(stock)}>
      <span>
        <b>{stock.name}</b>
        <div className="code">
          {stock.marketName} · {stock.code}
        </div>
      </span>
      <span className={`mkt-badge ${overseas ? "us" : "kr"}`}>{overseas ? "해외" : "국내"}</span>
    </button>
  );
}
