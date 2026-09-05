import categories from "@/data/categories.json";
import type { CategoryPick, Side } from "./types";

export type CategoryRow = {
  dataset: string;
  side: string;
  group: string | null;
  label: string;
  meta: string;
};

const rows = categories as CategoryRow[];

export function reasonGroups() {
  const map = new Map<string, CategoryRow[]>();
  for (const row of rows) {
    if (row.dataset !== "판단근거") continue;
    const key = row.group || "기타";
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }));
}

export function moodOptions(side: Side) {
  const want = side === "buy" ? "매수" : "매도";
  return rows.filter((r) => r.dataset === "당시상태" && r.side === want);
}

export function toPick(row: CategoryRow): CategoryPick {
  return { group: row.group, label: row.label, meta: row.meta };
}

export function comboKey(trade: { side: Side; reasons: CategoryPick[]; moods: CategoryPick[] }) {
  const reason = trade.reasons[0]?.group || trade.reasons[0]?.meta || "미선택";
  const mood = trade.moods[0]?.meta || trade.moods[0]?.label || "미선택";
  return `${trade.side}|${reason}|${mood}`;
}

export function comboLabel(trade: { side: Side; reasons: CategoryPick[]; moods: CategoryPick[] }) {
  const reason = trade.reasons[0]?.group || "판단 근거 없음";
  const mood = trade.moods[0]?.label || "당시 상태 없음";
  return { reason, mood };
}
