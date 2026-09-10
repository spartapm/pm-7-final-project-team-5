import { migratePlan, migrateTrade } from "./plans";
import type { AppState, IssuedCard, Plan, Trade } from "./types";
import { getSupabase, isMissingTable } from "./supabase";

export type CloudStatus = "ok" | "missing-table" | "error" | "off";

export type IssueBaseline = { buy: number; sell: number };

export type CloudAccount = {
  id: string;
  kakaoId: string | null;
  nickname: string;
  onboarded: boolean;
  loginAt: number | null;
  termsAccepted: boolean;
  termsVersion: string | null;
  termsAcceptedAt: number | null;
  passwordHash: string | null;
  plans: Plan[];
  trades: Trade[];
  issuedCards: IssuedCard[];
  issueBaseline: IssueBaseline;
};

function toIso(ms: number | null) {
  if (!ms) return null;
  return new Date(ms).toISOString();
}

function fromIso(iso: string | null | undefined, fallback = Date.now()) {
  if (!iso) return fallback;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? fallback : t;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function rowToPlan(row: Record<string, unknown>): Plan {
  return migratePlan({
    id: row.id,
    side: row.side,
    stockCode: row.stock_code,
    stockName: row.stock_name,
    market: row.market,
    targetBuy: row.target_buy,
    buyMin: row.buy_min ?? row.target_buy,
    buyMax: row.buy_max,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    memo: row.memo,
    createdAt: fromIso(row.created_at as string),
    updatedAt: fromIso(row.updated_at as string),
  });
}

function rowToTrade(row: Record<string, unknown>): Trade {
  return migrateTrade({
    id: row.id,
    planId: row.plan_id,
    side: row.side,
    stockCode: row.stock_code,
    stockName: row.stock_name,
    market: row.market,
    price: row.price,
    qty: row.qty,
    tradedAt: String(row.traded_at).slice(0, 10),
    tradedTime: row.traded_time,
    reasons: row.reasons,
    moods: row.moods,
    isPractice: row.is_practice,
    createdAt: fromIso(row.created_at as string),
    planSnapshot: row.plan_snapshot,
    hiddenPlan: row.hidden_plan,
  });
}

function rowToCard(row: Record<string, unknown>): IssuedCard {
  return {
    id: String(row.id),
    side: row.side === "sell" ? "sell" : "buy",
    issuedAt: fromIso(row.issued_at as string),
    dateKey: String(row.date_key).slice(0, 10),
    moodMeta: String(row.mood_meta ?? ""),
    moodLabel: String(row.mood_label ?? ""),
    reasonLevel: row.reason_level === "group" ? "group" : "sub",
    reasonGroup: String(row.reason_group ?? ""),
    reasonMeta: String(row.reason_meta ?? ""),
    reasonLabels: asStringArray(row.reason_labels),
    count: Number(row.match_count ?? 0),
    windowSize: Number(row.window_size ?? 0),
    score: Number(row.score ?? 0),
    narrative1: String(row.narrative1 ?? ""),
    narrative2: String(row.narrative2 ?? ""),
    relatedTradeIds: asStringArray(row.related_trade_ids),
    read: Boolean(row.read),
  };
}

function cardToRow(accountId: string, card: IssuedCard) {
  return {
    id: card.id,
    account_id: accountId,
    side: card.side,
    issued_at: toIso(card.issuedAt),
    date_key: card.dateKey,
    mood_meta: card.moodMeta,
    mood_label: card.moodLabel,
    reason_level: card.reasonLevel,
    reason_group: card.reasonGroup,
    reason_meta: card.reasonMeta,
    reason_labels: card.reasonLabels,
    match_count: card.count,
    window_size: card.windowSize,
    score: card.score,
    narrative1: card.narrative1,
    narrative2: card.narrative2,
    related_trade_ids: card.relatedTradeIds,
    read: card.read,
    read_at: card.read ? toIso(Date.now()) : null,
  };
}

export function mergeIssuedCards(local: IssuedCard[], remote: IssuedCard[]): IssuedCard[] {
  const map = new Map<string, IssuedCard>();
  for (const card of remote) map.set(card.id, { ...card });
  for (const card of local) {
    const prev = map.get(card.id);
    if (!prev) {
      map.set(card.id, card);
      continue;
    }
    map.set(card.id, { ...prev, read: prev.read || card.read });
  }
  return [...map.values()].sort((a, b) => a.issuedAt - b.issuedAt);
}

export function mergeIssueBaseline(local: IssueBaseline, remote?: IssueBaseline): IssueBaseline {
  return {
    buy: Math.max(local.buy, remote?.buy ?? 0),
    sell: Math.max(local.sell, remote?.sell ?? 0),
  };
}

export async function findAccountByKakao(kakaoId: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const res = await sb.from("accounts").select("id, kakao_id, nickname, onboarded").eq("kakao_id", kakaoId).maybeSingle();
  if (res.error || !res.data) return null;
  return { id: String(res.data.id), kakaoId: String(res.data.kakao_id), nickname: String(res.data.nickname || "회원"), onboarded: Boolean(res.data.onboarded) };
}

export async function findAccountByEmail(email: string) {
  const sb = getSupabase();
  if (!sb) return null;
  const key = email.trim().toLowerCase();
  if (!key) return null;
  const cols = "id, email, nickname, onboarded, password_hash";
  let res = await sb.from("accounts").select(cols).eq("email", key).maybeSingle();
  if (res.error && /password_hash/.test(res.error.message)) {
    res = await sb.from("accounts").select("id, email, nickname, onboarded").eq("email", key).maybeSingle();
  }
  if (res.error || !res.data) return null;
  const row = res.data as { id: string; email?: string; nickname?: string; onboarded?: boolean; password_hash?: string | null };
  return {
    id: String(row.id),
    email: String(row.email || key),
    nickname: String(row.nickname || "회원"),
    onboarded: Boolean(row.onboarded),
    passwordHash: row.password_hash ? String(row.password_hash) : null,
  };
}

export async function bindEmailPassword(accountId: string, hash: string) {
  const sb = getSupabase();
  if (!sb || !hash) return false;
  const res = await sb.from("accounts").update({ password_hash: hash }).eq("id", accountId);
  return !res.error;
}

export async function pullAccount(accountId: string): Promise<{
  status: CloudStatus;
  data?: CloudAccount;
  message?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { status: "off" };

  const fullCols = "id, kakao_id, nickname, onboarded, login_at, terms_version, terms_accepted_at, password_hash, issue_baseline_buy, issue_baseline_sell";
  const baseCols = "id, kakao_id, nickname, onboarded, login_at, issue_baseline_buy, issue_baseline_sell";
  let accountRes = await sb.from("accounts").select(fullCols).eq("id", accountId).maybeSingle();
  if (accountRes.error && /password_hash|terms_/.test(accountRes.error.message)) {
    accountRes = await sb.from("accounts").select(baseCols).eq("id", accountId).maybeSingle();
  }
  if (accountRes.error) {
    if (isMissingTable(accountRes.error)) return { status: "missing-table" };
    return { status: "error", message: accountRes.error.message };
  }
  if (!accountRes.data) {
    return { status: "ok" };
  }

  const [planRes, tradeRes, cardRes] = await Promise.all([
    sb.from("plans").select("*").eq("account_id", accountId),
    sb.from("trades").select("*").eq("account_id", accountId),
    sb.from("insight_cards").select("*").eq("account_id", accountId),
  ]);
  for (const res of [planRes, tradeRes, cardRes]) {
    if (res.error) {
      if (isMissingTable(res.error)) return { status: "missing-table" };
      return { status: "error", message: res.error.message };
    }
  }

  return {
    status: "ok",
    data: {
      id: accountId,
      kakaoId: accountRes.data.kakao_id ?? null,
      nickname: accountRes.data.nickname || "회원",
      onboarded: Boolean(accountRes.data.onboarded),
      loginAt: accountRes.data.login_at ? fromIso(accountRes.data.login_at) : null,
      termsAccepted: Boolean(accountRes.data.terms_accepted_at),
      termsVersion: accountRes.data.terms_version ? String(accountRes.data.terms_version) : null,
      termsAcceptedAt: accountRes.data.terms_accepted_at ? fromIso(accountRes.data.terms_accepted_at) : null,
      passwordHash: accountRes.data.password_hash ? String(accountRes.data.password_hash) : null,
      plans: (planRes.data ?? []).map(rowToPlan),
      trades: (tradeRes.data ?? []).map(rowToTrade),
      issuedCards: (cardRes.data ?? []).map(rowToCard),
      issueBaseline: {
        buy: Number(accountRes.data.issue_baseline_buy ?? 0),
        sell: Number(accountRes.data.issue_baseline_sell ?? 0),
      },
    },
  };
}

export async function pushAccount(state: AppState): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "off";
  if (!state.loggedIn) return "ok";

  const payload = {
    id: state.accountId,
    kakao_id: state.kakaoId,
    email: state.email ? state.email.trim().toLowerCase() : state.email,
    nickname: state.nickname,
    onboarded: state.onboarded,
    login_at: toIso(state.loginAt),
    terms_version: state.termsVersion,
    terms_accepted_at: toIso(state.termsAcceptedAt),
    password_hash: state.passwordHash,
    issue_baseline_buy: state.issueBaseline.buy,
    issue_baseline_sell: state.issueBaseline.sell,
    updated_at: new Date().toISOString(),
  };
  let acc = await sb.from("accounts").upsert(payload);
  if (acc.error && /password_hash/.test(acc.error.message)) {
    const { password_hash: _drop, ...rest } = payload;
    acc = await sb.from("accounts").upsert(rest);
  }
  if (acc.error) {
    if (isMissingTable(acc.error)) return "missing-table";
    return "error";
  }

  const [existingPlans, existingTrades] = await Promise.all([
    sb.from("plans").select("id").eq("account_id", state.accountId),
    sb.from("trades").select("id").eq("account_id", state.accountId),
  ]);
  if (existingPlans.error || existingTrades.error) {
    if (isMissingTable(existingPlans.error) || isMissingTable(existingTrades.error)) {
      return "missing-table";
    }
    return "error";
  }

  const planIds = new Set(state.plans.map((p) => p.id));
  const tradeIds = new Set(state.trades.map((t) => t.id));
  const stalePlans = (existingPlans.data ?? []).map((r) => r.id).filter((id) => !planIds.has(id));
  const staleTrades = (existingTrades.data ?? []).map((r) => r.id).filter((id) => !tradeIds.has(id));

  if (staleTrades.length) await sb.from("trades").delete().in("id", staleTrades);
  if (stalePlans.length) await sb.from("plans").delete().in("id", stalePlans);

  if (state.plans.length) {
    const planUpsert = await sb.from("plans").upsert(
      state.plans.map((p) => ({
        id: p.id,
        account_id: state.accountId,
        stock_code: p.stockCode,
        stock_name: p.stockName,
        market: p.market,
        side: p.side,
        buy_min: p.buyMin,
        buy_max: p.buyMax,
        target_buy: p.buyMin,
        stop_loss: p.stopLoss,
        take_profit: p.takeProfit,
        memo: p.memo,
        created_at: toIso(p.createdAt),
        updated_at: toIso(p.updatedAt),
      }))
    );
    if (planUpsert.error) {
      if (isMissingTable(planUpsert.error)) return "missing-table";
      return "error";
    }
  }

  if (state.trades.length) {
    const tradeUpsert = await sb.from("trades").upsert(
      state.trades.map((t) => ({
        id: t.id,
        account_id: state.accountId,
        plan_id: t.planId,
        side: t.side,
        stock_code: t.stockCode,
        stock_name: t.stockName,
        market: t.market,
        price: t.price,
        qty: t.qty,
        traded_at: t.tradedAt,
        traded_time: t.tradedTime || null,
        reasons: t.reasons,
        moods: t.moods,
        is_practice: t.isPractice,
        plan_snapshot: t.planSnapshot,
        hidden_plan: t.hiddenPlan ?? {},
        created_at: toIso(t.createdAt),
      }))
    );
    if (tradeUpsert.error) {
      if (isMissingTable(tradeUpsert.error)) return "missing-table";
      return "error";
    }
  }

  if (state.issuedCards.length) {
    const cardInsert = await sb.from("insight_cards").upsert(
      state.issuedCards.map((c) => cardToRow(state.accountId, c)),
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (cardInsert.error) {
      if (isMissingTable(cardInsert.error)) return "missing-table";
      return "error";
    }
  }

  const readIds = state.issuedCards.filter((c) => c.read).map((c) => c.id);
  if (readIds.length) {
    const readUpdate = await sb
      .from("insight_cards")
      .update({ read: true, read_at: new Date().toISOString() })
      .in("id", readIds)
      .eq("account_id", state.accountId)
      .eq("read", false);
    if (readUpdate.error) {
      if (isMissingTable(readUpdate.error)) return "missing-table";
      return "error";
    }
  }

  return "ok";
}

export async function deleteAccount(accountId: string): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "off";
  const res = await sb.from("accounts").delete().eq("id", accountId);
  if (res.error) {
    if (isMissingTable(res.error)) return "missing-table";
    return "error";
  }
  return "ok";
}
