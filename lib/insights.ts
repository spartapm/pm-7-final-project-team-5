import { comboKey, comboLabel, reasonGroups } from "./categories";
import { sideLabel, todayKey, uid } from "./format";
import { endingFor, fallbackNarrative1, fallbackNarrative2, isExcludedMood, moodChartOf, moodMetaOf } from "./insight-copy";
import type { IssuedCard, Side, Trade } from "./types";

export const INSIGHT_THRESHOLD = 3;
export const WINDOW = 10;

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

function realOf(trades: Trade[]) {
  return trades.filter((t) => !t.isPractice);
}

export function sideTrades(trades: Trade[], side: Side) {
  return realOf(trades)
    .filter((t) => t.side === side)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function analysisWindow(trades: Trade[], side: Side) {
  const list = sideTrades(trades, side).filter((t) => !t.moods.some(isExcludedMood));
  return list.slice(-WINDOW);
}

function ratioNeed(n: number) {
  return n >= 6 ? 0.4 : 0.5;
}

export type Candidate = {
  side: Side;
  moodMeta: string;
  moodLabel: string;
  reasonLevel: "sub" | "group";
  reasonGroup: string;
  reasonMeta: string;
  reasonLabels: string[];
  count: number;
  windowSize: number;
  score: number;
  tradeIds: string[];
};

export function detectCandidates(trades: Trade[], side: Side): Candidate[] {
  const win = analysisWindow(trades, side);
  const W = win.length;
  if (W < INSIGHT_THRESHOLD) return [];
  const groups = reasonGroups();
  const pool: Candidate[] = [];

  const moodKeys = new Map<string, { label: string; meta: string }>();
  for (const t of win) {
    for (const m of t.moods) {
      if (isExcludedMood(m)) continue;
      const meta = moodMetaOf(m);
      if (!moodKeys.has(meta)) moodKeys.set(meta, { label: m.label, meta });
    }
  }

  for (const mood of moodKeys.values()) {
    const satisfiedGroups = new Set<string>();
    for (const g of groups) {
      for (const item of g.items) {
        const matched = win.filter(
          (t) => t.moods.some((m) => moodMetaOf(m) === mood.meta) && t.reasons.some((r) => r.label === item.label)
        );
        const n = matched.length;
        const ratio = n / W;
        if (n >= 3 && ratio >= ratioNeed(n)) {
          pool.push({
            side,
            moodMeta: mood.meta,
            moodLabel: mood.label,
            reasonLevel: "sub",
            reasonGroup: g.group,
            reasonMeta: item.meta,
            reasonLabels: [item.label],
            count: n,
            windowSize: W,
            score: n * ratio * 1.5,
            tradeIds: matched.map((t) => t.id),
          });
          satisfiedGroups.add(g.group);
        }
      }
    }
    for (const g of groups) {
      if (satisfiedGroups.has(g.group)) continue;
      const labels = g.items.map((i) => i.label);
      const matched = win.filter(
        (t) => t.moods.some((m) => moodMetaOf(m) === mood.meta) && t.reasons.some((r) => r.group === g.group)
      );
      const n = matched.length;
      const ratio = n / W;
      if (n >= 3 && ratio >= ratioNeed(n)) {
        const used = [...new Set(matched.flatMap((t) => t.reasons.filter((r) => r.group === g.group).map((r) => r.label)))];
        pool.push({
          side,
          moodMeta: mood.meta,
          moodLabel: mood.label,
          reasonLevel: "group",
          reasonGroup: g.group,
          reasonMeta: g.items[0]?.meta || g.group,
          reasonLabels: used.length ? used : labels,
          count: n,
          windowSize: W,
          score: n * ratio * 1.0,
          tradeIds: matched.map((t) => t.id),
        });
      }
    }
  }

  return pool.sort((a, b) => b.score - a.score);
}

export function candidateKey(c: {
  moodMeta: string;
  reasonLevel: string;
  reasonGroup?: string;
  reasonMeta: string;
  reasonLabels: string[];
}) {
  return [c.moodMeta, c.reasonLevel, c.reasonGroup || c.reasonMeta, [...c.reasonLabels].sort().join("|")].join("::");
}

export function applyIssueCooldown(cands: Candidate[], issued: IssuedCard[]) {
  const ready = cands.filter((c) => {
    const prev = issued
      .filter((card) => candidateKey(card) === candidateKey(c))
      .sort((a, b) => b.issuedAt - a.issuedAt)[0];
    if (!prev) return true;
    if (c.count >= prev.count + 2) return true;
    if (prev.score > 0 && c.score >= prev.score * 1.2) return true;
    return false;
  });
  return ready.slice(0, 1);
}

export function shouldAttemptIssue(sideCount: number, baseline: number) {
  if (sideCount < INSIGHT_THRESHOLD) return false;
  if (baseline === 0) return true;
  return sideCount >= baseline + INSIGHT_THRESHOLD;
}

export function candidateToCard(c: Candidate, n1: string, n2: string): IssuedCard {
  return {
    id: uid("ins"),
    side: c.side,
    issuedAt: Date.now(),
    dateKey: todayKey(),
    moodMeta: c.moodMeta,
    moodLabel: c.moodLabel,
    reasonLevel: c.reasonLevel,
    reasonGroup: c.reasonGroup,
    reasonMeta: c.reasonMeta,
    reasonLabels: c.reasonLabels,
    count: c.count,
    windowSize: c.windowSize,
    score: c.score,
    narrative1: n1 || fallbackNarrative1(c.moodLabel, c.count),
    narrative2: n2 || fallbackNarrative2(c.moodLabel, c.count, c.reasonLabels),
    relatedTradeIds: c.tradeIds,
    read: false,
  };
}

export function summarizeInsights(trades: Trade[]): InsightSummary {
  const real = realOf(trades);
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

export function groupedIssued(cards: IssuedCard[]) {
  const byDate = new Map<string, IssuedCard[]>();
  for (const c of [...cards].sort((a, b) => b.issuedAt - a.issuedAt)) {
    const list = byDate.get(c.dateKey) ?? [];
    list.push(c);
    byDate.set(c.dateKey, list);
  }
  return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export function latestPerSide(cards: IssuedCard[]) {
  const buy = cards.filter((c) => c.side === "buy").sort((a, b) => b.issuedAt - a.issuedAt)[0];
  const sell = cards.filter((c) => c.side === "sell").sort((a, b) => b.issuedAt - a.issuedAt)[0];
  return { buy, sell };
}

export function dateGroupLatest(cards: IssuedCard[]) {
  const { buy, sell } = latestPerSide(cards);
  return [buy, sell].filter(Boolean) as IssuedCard[];
}

export function insightHref(cardId: string) {
  return `/insights/related?id=${encodeURIComponent(cardId)}`;
}

export function dateHref(dateKey: string) {
  return `/insights/date?date=${encodeURIComponent(dateKey)}`;
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
      if (isExcludedMood(m)) continue;
      const key = moodChartOf(m);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function reasonSubDistribution(trades: Trade[], group: string) {
  const counts = new Map<string, number>();
  for (const t of trades) {
    for (const r of t.reasons) {
      if ((r.group || "기타") !== group) continue;
      const key = r.meta || r.label;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function comboTop3(trades: Trade[]) {
  const map = new Map<string, { n: number; latest: number }>();
  for (const t of realOf(trades)) {
    if (!t.reasons.length || !t.moods.length) continue;
    const { reason } = comboLabel(t);
    const mood = t.moods[0] ? moodChartOf(t.moods[0]) : "당시 상태 없음";
    const key = `${sideLabel(t.side)} · ${reason} · ${mood}`;
    const prev = map.get(key);
    map.set(key, { n: (prev?.n ?? 0) + 1, latest: Math.max(prev?.latest ?? 0, t.createdAt) });
  }
  return [...map.entries()]
    .sort((a, b) => (b[1].n !== a[1].n ? b[1].n - a[1].n : b[1].latest - a[1].latest))
    .slice(0, 3)
    .map(([name, v]) => [name, v.n] as [string, number]);
}

export function reasonChip(card: IssuedCard) {
  return `${sideLabel(card.side)} · ${card.reasonMeta} · ${card.count}건`;
}

export { endingFor };
