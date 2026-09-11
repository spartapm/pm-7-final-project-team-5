import { formatPrice } from "./format";
import { canonStockCode, sameStockCode } from "./markets";
import type { Plan, PlanSnapshot, Side, Trade } from "./types";

export function findPlan(plans: Plan[], stockCode: string, market: string, side: Side) {
  return (
    plans.find((p) => sameStockCode(p.stockCode, stockCode) && p.market === market && p.side === side) ??
    plans.find((p) => sameStockCode(p.stockCode, stockCode) && p.side === side) ??
    null
  );
}

export function snapshotForStock(plans: Plan[], stockCode: string, market: string): PlanSnapshot | null {
  const buy = findPlan(plans, stockCode, market, "buy");
  const sell = findPlan(plans, stockCode, market, "sell");
  const snap: PlanSnapshot = {};
  if (buy && buy.buyMin != null && buy.buyMax != null) snap.buy = { min: buy.buyMin, max: buy.buyMax };
  if (sell && sell.stopLoss != null && sell.takeProfit != null) {
    snap.sell = { stopLoss: sell.stopLoss, takeProfit: sell.takeProfit };
  }
  return snap.buy || snap.sell ? snap : null;
}

export function planSummary(plan: Plan) {
  if (plan.side === "buy") {
    const min = plan.buyMin != null ? formatPrice(plan.buyMin, plan.market) : "-";
    const max = plan.buyMax != null ? formatPrice(plan.buyMax, plan.market) : "-";
    return `희망가 ${min}~${max}`;
  }
  const stop = plan.stopLoss != null ? formatPrice(plan.stopLoss, plan.market) : "-";
  const take = plan.takeProfit != null ? formatPrice(plan.takeProfit, plan.market) : "-";
  return `목표가 ${take} 손절가 ${stop}`;
}

export function buyCaption(actual: number, min: number, max: number) {
  if (actual < min) return { inRange: false, caption: "목표 구간보다 낮게 매수했어요", pct: 0 };
  if (actual > max) return { inRange: false, caption: "목표 구간보다 높게 매수했어요", pct: 100 };
  const span = max - min || 1;
  const pct = ((actual - min) / span) * 100;
  return { inRange: true, caption: "구간 안에서 매수했어요", pct };
}

export function sellCaption(actual: number, stop: number, take: number) {
  if (actual < stop) return { inRange: false, caption: "손절가보다 낮게 매도했어요", pct: 0 };
  if (actual > take) return { inRange: false, caption: "목표가보다 높게 매도했어요", pct: 100 };
  const span = take - stop || 1;
  const pct = ((actual - stop) / span) * 100;
  const caption =
    pct <= 25 ? "손절가 근처에서 계획대로 매도했어요" : pct >= 75 ? "목표가 근처에서 계획대로 매도했어요" : "구간 안에서 계획대로 매도했어요";
  return { inRange: true, caption, pct };
}

export function migratePlan(raw: Record<string, unknown>): Plan {
  const side: Side = raw.side === "sell" || raw.takeProfit != null && raw.targetBuy == null && raw.buyMin == null ? "sell" : "buy";
  const targetBuy = raw.targetBuy == null ? null : Number(raw.targetBuy);
  const buyMin = raw.buyMin == null ? targetBuy : Number(raw.buyMin);
  const buyMax = raw.buyMax == null ? targetBuy : Number(raw.buyMax);
  return {
    id: String(raw.id),
    side: (raw.side as Side) || side,
    stockCode: canonStockCode(String(raw.stockCode), String(raw.market)),
    stockName: String(raw.stockName),
    market: String(raw.market),
    buyMin,
    buyMax,
    stopLoss: raw.stopLoss == null ? null : Number(raw.stopLoss),
    takeProfit: raw.takeProfit == null ? null : Number(raw.takeProfit),
    memo: String(raw.memo ?? ""),
    createdAt: Number(raw.createdAt) || Date.now(),
    updatedAt: Number(raw.updatedAt) || Date.now(),
  };
}

export function migrateTrade(raw: Record<string, unknown>): Trade {
  return {
    id: String(raw.id),
    planId: raw.planId ? String(raw.planId) : null,
    side: raw.side === "sell" ? "sell" : "buy",
    stockCode: canonStockCode(String(raw.stockCode), String(raw.market)),
    stockName: String(raw.stockName),
    market: String(raw.market),
    price: Number(raw.price),
    qty: Number(raw.qty),
    tradedAt: String(raw.tradedAt).slice(0, 10),
    tradedTime: String(raw.tradedTime ?? ""),
    reasons: Array.isArray(raw.reasons) ? (raw.reasons as Trade["reasons"]) : [],
    moods: Array.isArray(raw.moods) ? (raw.moods as Trade["moods"]) : [],
    isPractice: Boolean(raw.isPractice),
    createdAt: Number(raw.createdAt) || Date.now(),
    planSnapshot: (raw.planSnapshot as PlanSnapshot) || null,
    hiddenPlan: (raw.hiddenPlan as Trade["hiddenPlan"]) || {},
  };
}
