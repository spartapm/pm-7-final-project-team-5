import stocks from "@/data/stocks.json";
import { isKorea, isOverseas, sameStockCode } from "./markets";
import type { Stock } from "./types";

const all = stocks as Stock[];

const FEATURED_KR = [
  "005930",
  "000660",
  "035420",
  "035720",
  "373220",
  "005380",
  "006400",
  "051910",
  "068270",
  "207940",
];

const FEATURED_US = ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "AMD", "NFLX", "INTC"];

export type StockRegion = "all" | "kr" | "us";

function inRegion(s: Stock, region: StockRegion) {
  if (region === "kr") return isKorea(s.market);
  if (region === "us") return isOverseas(s.market);
  return true;
}

export function featuredStocks(region: StockRegion = "all"): Stock[] {
  const codes = region === "us" ? FEATURED_US : region === "kr" ? FEATURED_KR : [...FEATURED_KR, ...FEATURED_US];
  return codes.map((code) => all.find((s) => s.code === code)).filter(Boolean) as Stock[];
}

export function searchStocks(query: string, limit = 20, region: StockRegion = "all"): Stock[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, "");
  const pool = all.filter((s) => inRegion(s, region));
  if (!q) return featuredStocks(region).slice(0, limit);
  const starts: Stock[] = [];
  const contains: Stock[] = [];
  for (const s of pool) {
    const name = s.name.toLowerCase().replace(/\s+/g, "");
    const code = s.code.toLowerCase().replace(/\s+/g, "");
    if (name.startsWith(q) || code.startsWith(q)) starts.push(s);
    else if (name.includes(q) || code.includes(q)) contains.push(s);
    if (starts.length >= limit) break;
  }
  const byName = (a: Stock, b: Stock) => a.name.localeCompare(b.name, "ko");
  return [...starts, ...contains].sort(byName).slice(0, limit);
}

export function findStock(code: string, market?: string) {
  return (
    all.find((s) => s.code === code && (!market || s.market === market)) ??
    all.find((s) => s.code === code) ??
    all.find((s) => sameStockCode(s.code, code) && (!market || s.market === market)) ??
    all.find((s) => sameStockCode(s.code, code)) ??
    null
  );
}
