import type { AppState, Plan, Trade } from "./types";
import { getSupabase, isMissingTable } from "./supabase";

export type CloudStatus = "ok" | "missing-table" | "error" | "off";

export type CloudAccount = {
  id: string;
  kakaoId: string | null;
  nickname: string;
  onboarded: boolean;
  loginAt: number | null;
  plans: Plan[];
  trades: Trade[];
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

function rowToPlan(row: Record<string, unknown>): Plan {
  return {
    id: String(row.id),
    stockCode: String(row.stock_code),
    stockName: String(row.stock_name),
    market: String(row.market),
    targetBuy: row.target_buy == null ? null : Number(row.target_buy),
    stopLoss: row.stop_loss == null ? null : Number(row.stop_loss),
    takeProfit: row.take_profit == null ? null : Number(row.take_profit),
    memo: String(row.memo ?? ""),
    createdAt: fromIso(row.created_at as string),
    updatedAt: fromIso(row.updated_at as string),
  };
}

function rowToTrade(row: Record<string, unknown>): Trade {
  return {
    id: String(row.id),
    planId: row.plan_id ? String(row.plan_id) : null,
    side: row.side === "sell" ? "sell" : "buy",
    stockCode: String(row.stock_code),
    stockName: String(row.stock_name),
    market: String(row.market),
    price: Number(row.price),
    qty: Number(row.qty),
    tradedAt: String(row.traded_at).slice(0, 10),
    tradedTime: String(row.traded_time ?? ""),
    reasons: Array.isArray(row.reasons) ? (row.reasons as Trade["reasons"]) : [],
    moods: Array.isArray(row.moods) ? (row.moods as Trade["moods"]) : [],
    isPractice: Boolean(row.is_practice),
    createdAt: fromIso(row.created_at as string),
  };
}

export async function pullAccount(accountId: string): Promise<{
  status: CloudStatus;
  data?: CloudAccount;
  message?: string;
}> {
  const sb = getSupabase();
  if (!sb) return { status: "off" };

  const accountRes = await sb
    .from("accounts")
    .select("id, kakao_id, nickname, onboarded, login_at")
    .eq("id", accountId)
    .maybeSingle();
  if (accountRes.error) {
    if (isMissingTable(accountRes.error)) return { status: "missing-table" };
    return { status: "error", message: accountRes.error.message };
  }
  if (!accountRes.data) {
    return {
      status: "ok",
      data: {
        id: accountId,
        kakaoId: null,
        nickname: "회원",
        onboarded: false,
        loginAt: null,
        plans: [],
        trades: [],
      },
    };
  }

  const [planRes, tradeRes] = await Promise.all([
    sb.from("plans").select("*").eq("account_id", accountId),
    sb.from("trades").select("*").eq("account_id", accountId),
  ]);
  for (const res of [planRes, tradeRes]) {
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
      plans: (planRes.data ?? []).map(rowToPlan),
      trades: (tradeRes.data ?? []).map(rowToTrade),
    },
  };
}

export async function pushAccount(state: AppState): Promise<CloudStatus> {
  const sb = getSupabase();
  if (!sb) return "off";
  if (!state.loggedIn) return "ok";

  const acc = await sb.from("accounts").upsert({
    id: state.accountId,
    kakao_id: state.kakaoId,
    nickname: state.nickname,
    onboarded: state.onboarded,
    login_at: toIso(state.loginAt),
    updated_at: new Date().toISOString(),
  });
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
        target_buy: p.targetBuy,
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
        created_at: toIso(t.createdAt),
      }))
    );
    if (tradeUpsert.error) {
      if (isMissingTable(tradeUpsert.error)) return "missing-table";
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
