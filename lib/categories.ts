import categories from "@/data/categories.json";
import type { CategoryPick, Side } from "./types";

export type CategoryRow = {
  dataset: string;
  side: string;
  group: string | null;
  groupSub?: string;
  label: string;
  meta: string;
  subtitle?: string;
};

const rows = categories as CategoryRow[];

export type ReasonGroup = {
  group: string;
  subtitle: string;
  items: CategoryRow[];
};

export function reasonGroups(): ReasonGroup[] {
  const map = new Map<string, ReasonGroup>();
  for (const row of rows) {
    if (row.dataset !== "판단근거") continue;
    const key = row.group || "기타";
    const cur = map.get(key);
    if (cur) cur.items.push(row);
    else map.set(key, { group: key, subtitle: row.groupSub || "", items: [row] });
  }
  return [...map.values()];
}

export function moodOptions(side: Side) {
  const want = side === "buy" ? "매수" : "매도";
  const dedicated = rows.filter((r) => r.dataset === "당시상태" && r.side === want);
  const shared = rows.filter((r) => r.dataset === "당시상태" && r.side === "공통");
  return [...dedicated, ...shared];
}

export function toPick(row: CategoryRow): CategoryPick {
  return { group: row.group, label: row.label, meta: row.meta, subtitle: row.subtitle };
}

export function pickKey(pick: CategoryPick) {
  return pick.meta || pick.label;
}

export function isActiveReason(pick: CategoryPick) {
  return rows.some((r) => r.dataset === "판단근거" && (r.meta === pick.meta || r.label === pick.label));
}

export function isActiveMood(pick: CategoryPick) {
  return rows.some((r) => r.dataset === "당시상태" && (r.meta === pick.meta || r.label === pick.label));
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

function normalizeQuery(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[·,/\-()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type MatchRank = 0 | 1 | 2;

function rankMatch(query: string, title: string, subtitle: string): MatchRank | null {
  const t = normalizeQuery(title);
  const s = normalizeQuery(subtitle);
  if (!query) return null;
  if (t === query || s === query) return 0;
  if (t.includes(query)) return 1;
  if (s.includes(query)) return 2;
  return null;
}

export type ReasonSearchResult = {
  categories: { group: ReasonGroup; rank: MatchRank }[];
  items: { item: CategoryRow; group: ReasonGroup; rank: MatchRank }[];
};

export function searchReasons(raw: string): ReasonSearchResult {
  const query = normalizeQuery(raw);
  if (!query) return { categories: [], items: [] };
  const groups = reasonGroups();
  const categories: { group: ReasonGroup; rank: MatchRank }[] = [];
  for (const group of groups) {
    const rank = rankMatch(query, group.group, group.subtitle);
    if (rank !== null) categories.push({ group, rank });
  }
  categories.sort((a, b) => a.rank - b.rank || a.group.group.localeCompare(b.group.group, "ko"));

  const titleHitGroups = new Set(categories.filter((c) => c.rank === 0 || c.rank === 1).map((c) => c.group.group));
  const items: { item: CategoryRow; group: ReasonGroup; rank: MatchRank }[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      const rank = rankMatch(query, item.label, item.subtitle || "");
      if (rank === null) continue;
      if (titleHitGroups.has(group.group)) continue;
      items.push({ item, group, rank });
    }
  }
  items.sort((a, b) => a.rank - b.rank || a.item.label.localeCompare(b.item.label, "ko"));
  return { categories, items };
}

export function findReasonByMeta(meta: string) {
  return rows.find((r) => r.dataset === "판단근거" && r.meta === meta) ?? null;
}

export function findMoodByMeta(meta: string) {
  return rows.find((r) => r.dataset === "당시상태" && r.meta === meta) ?? null;
}
