import { comboKey, comboLabel } from "./categories";
import { sideLabel } from "./format";
import type { Side, Trade } from "./types";

export const INSIGHT_THRESHOLD = 3;

export type ComboInsight = {
  key: string;
  side: Side;
  reason: string;
  mood: string;
  count: number;
  tradeIds: string[];
  observation: string;
  interpretation: string;
};

export type InsightSummary = {
  realTrades: Trade[];
  buyCount: number;
  sellCount: number;
  buyRemaining: number;
  sellRemaining: number;
  combos: ComboInsight[];
  ready: boolean;
};

function remaining(count: number) {
  return Math.max(0, INSIGHT_THRESHOLD - count);
}

export function summarizeInsights(trades: Trade[]): InsightSummary {
  const real = trades.filter((t) => !t.isPractice);
  const buyCount = real.filter((t) => t.side === "buy").length;
  const sellCount = real.filter((t) => t.side === "sell").length;

  const map = new Map<string, Trade[]>();
  for (const t of real) {
    if (!t.reasons.length || !t.moods.length) continue;
    const key = comboKey(t);
    const list = map.get(key) ?? [];
    list.push(t);
    map.set(key, list);
  }

  const combos: ComboInsight[] = [...map.entries()]
    .map(([key, list]) => {
      const sample = list[0]!;
      const { reason, mood } = comboLabel(sample);
      return {
        key,
        side: sample.side,
        reason,
        mood,
        count: list.length,
        tradeIds: list.map((t) => t.id),
        observation: `${sideLabel(sample.side)}할 때 ‘${reason}’와 ‘${mood}’가 ${list.length}번 겹쳤어요.`,
        interpretation:
          list.length >= INSIGHT_THRESHOLD
            ? `같은 판단 근거와 당시 상태가 ${list.length}건에서 반복되고 있어요.`
            : `같은 조합이 ${INSIGHT_THRESHOLD - list.length}건 더 쌓이면 반복 패턴으로 보여 드릴게요.`,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    realTrades: real,
    buyCount,
    sellCount,
    buyRemaining: remaining(buyCount),
    sellRemaining: remaining(sellCount),
    combos,
    ready: combos.some((c) => c.count >= INSIGHT_THRESHOLD) || buyCount >= INSIGHT_THRESHOLD || sellCount >= INSIGHT_THRESHOLD,
  };
}

export function issuedInsights(trades: Trade[]) {
  const summary = summarizeInsights(trades);
  return summary.combos
    .filter((c) => c.count >= INSIGHT_THRESHOLD)
    .map((c) => {
      const related = summary.realTrades.filter((t) => c.tradeIds.includes(t.id));
      const latest = Math.max(0, ...related.map((t) => t.createdAt));
      const newest = related.sort((a, b) => b.createdAt - a.createdAt)[0];
      const issuedOn = newest ? newest.tradedAt.slice(5).replace("-", ".") : "";
      return { ...c, latest, issuedOn, total: summary.realTrades.length };
    })
    .sort((a, b) => b.latest - a.latest);
}

export function insightHref(key: string) {
  return `/insights/related?key=${encodeURIComponent(key)}`;
}

export function reasonDistribution(trades: Trade[]) {
  const counts = new Map<string, number>();
  for (const t of trades) {
    for (const r of t.reasons) {
      const key = r.group || r.meta;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function moodDistribution(trades: Trade[]) {
  const counts = new Map<string, number>();
  for (const t of trades) {
    for (const m of t.moods) {
      counts.set(m.label, (counts.get(m.label) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
