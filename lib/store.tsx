"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  deleteAccount,
  mergeIssueBaseline,
  mergeIssuedCards,
  pullAccount,
  pushAccount,
  type CloudStatus,
} from "./cloud";
import { uid, todayKey } from "./format";
import { removeRegistry } from "./registry";
import {
  applyIssueCooldown,
  candidateToCard,
  detectCandidates,
  shouldAttemptIssue,
  sideTrades,
} from "./insights";
import { fallbackNarrative1, fallbackNarrative2 } from "./insight-copy";
import { migratePlan, migrateTrade, snapshotForStock } from "./plans";
import {
  pairId,
  planSessionId,
  recordElapsedSec,
  recordSessionId,
  RULE_VERSION,
  setAnalyticsUserId,
  TAXONOMY_VERSION,
  track,
} from "./analytics";
import type { AppState, DraftTrade, IssuedCard, Plan, PlanSnapshot, Side, Stock, ToastKind, Trade } from "./types";
import { TERMS_VERSION } from "./types";

const KEY = "patternnote:v1";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function empty(): AppState {
  return {
    accountId: uid("acc"),
    kakaoId: null,
    email: null,
    passwordHash: null,
    nickname: "회원",
    loggedIn: false,
    loginAt: null,
    onboarded: false,
    seenOnboarding: false,
    termsAccepted: false,
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: null,
    trades: [],
    plans: [],
    issuedCards: [],
    issueBaseline: { buy: 0, sell: 0 },
    recentSearches: [],
    insightCopy: {},
    seenInsightKeys: [],
    seenWelcome: false,
  };
}

function load(): AppState {
  const fallback = empty();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as AppState;
    const trades = (parsed.trades ?? []).map((t) => migrateTrade(t as unknown as Record<string, unknown>));
    const plans = (parsed.plans ?? []).map((p) => migratePlan(p as unknown as Record<string, unknown>));
    const issuedCards = Array.isArray(parsed.issuedCards) ? parsed.issuedCards : [];
    const sessionExpired = parsed.loggedIn && parsed.loginAt && Date.now() - parsed.loginAt > SESSION_MS;
    return {
      ...fallback,
      ...parsed,
      accountId: parsed.accountId || fallback.accountId,
      email: parsed.email ?? null,
      passwordHash: parsed.passwordHash ?? null,
      loggedIn: sessionExpired ? false : Boolean(parsed.loggedIn),
      loginAt: sessionExpired ? null : parsed.loginAt ?? null,
      termsAccepted: Boolean(parsed.termsAccepted),
      termsVersion: parsed.termsVersion || TERMS_VERSION,
      termsAcceptedAt: parsed.termsAcceptedAt ?? null,
      trades,
      plans,
      issuedCards,
      issueBaseline: parsed.issueBaseline ?? { buy: 0, sell: 0 },
      recentSearches: parsed.recentSearches ?? [],
      insightCopy: parsed.insightCopy ?? {},
      seenInsightKeys: parsed.seenInsightKeys ?? [],
      seenWelcome: Boolean(parsed.seenWelcome),
    };
  } catch {
    return fallback;
  }
}

type Store = AppState & {
  hydrated: boolean;
  cloudStatus: CloudStatus;
  querying: boolean;
  actionError: boolean;
  toast: { message: string; kind: ToastKind } | null;
  login: (opts?: { kakaoId?: string; nickname?: string; email?: string; accountId?: string; passwordHash?: string }) => void;
  completeSignup: (opts: {
    accountId: string;
    nickname: string;
    email?: string;
    kakaoId?: string;
    passwordHash?: string;
  }) => Promise<CloudStatus>;
  logout: () => void;
  withdraw: () => void;
  setNickname: (name: string) => void;
  acceptTerms: () => void;
  markOnboarded: () => void;
  skipOnboarding: () => void;
  addTrade: (draft: DraftTrade) => Trade | null;
  updateTrade: (id: string, draft: DraftTrade) => Trade | null;
  deleteTrade: (id: string) => void;
  hidePlanOnTrade: (tradeId: string, side: Side) => void;
  attachPlanToTrade: (tradeId: string, piece: PlanSnapshot) => void;
  addPlan: (plan: Omit<Plan, "id" | "createdAt" | "updatedAt">) => Plan;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  rememberSearch: (stock: Stock) => void;
  markCardsRead: () => void;
  markWelcomeSeen: () => void;
  showToast: (message: string, kind?: ToastKind) => void;
  clearToast: () => void;
  retryPull: () => void;
  retryPush: () => void;
};

const Ctx = createContext<Store | null>(null);

async function copyForCandidate(c: {
  side: Side;
  moodLabel: string;
  moodMeta: string;
  reasonLabels: string[];
  reasonMeta: string;
  count: number;
}) {
  try {
    const res = await fetch("/api/insight-copy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        side: c.side,
        moodLabel: c.moodLabel,
        moodMeta: c.moodMeta,
        reasonLabels: c.reasonLabels,
        reasonMeta: c.reasonMeta,
        count: c.count,
      }),
    });
    const data = (await res.json()) as { narrative1?: string; narrative2?: string; observation?: string; interpretation?: string };
    return {
      n1: data.narrative1 || data.observation || fallbackNarrative1(c.moodLabel, c.count),
      n2: data.narrative2 || data.interpretation || fallbackNarrative2(c.moodLabel, c.count, c.reasonLabels),
    };
  } catch {
    return { n1: fallbackNarrative1(c.moodLabel, c.count), n2: fallbackNarrative2(c.moodLabel, c.count, c.reasonLabels) };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(empty);
  const [hydrated, setHydrated] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("off");
  const [querying, setQuerying] = useState(false);
  const [actionError, setActionError] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: ToastKind } | null>(null);
  const skipPush = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;
  const mutGen = useRef(0);
  const touch = () => {
    mutGen.current += 1;
  };

  useEffect(() => {
    const loaded = load();
    setState(loaded);
    setHydrated(true);
    skipPush.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const runPull = useCallback(async (accountId: string, seed?: AppState) => {
    const local = seed ?? stateRef.current;
    const genAtPull = mutGen.current;
    setQuerying(true);
    const res = await pullAccount(accountId);
    setQuerying(false);
    if (res.status === "off") {
      setCloudStatus("off");
      return;
    }
    setCloudStatus(res.status);
    if (res.status !== "ok" || !res.data) return;
    if (mutGen.current !== genAtPull) return;
    const remote = res.data;
    const hasRemote = remote.trades.length > 0 || remote.plans.length > 0 || remote.kakaoId;
    const remoteNick = remote.nickname && remote.nickname !== "회원" ? remote.nickname : null;
    setState((s) => ({
      ...s,
      kakaoId: remote.kakaoId ?? s.kakaoId,
      nickname: remoteNick || s.nickname,
      onboarded: remote.onboarded || s.onboarded,
      termsAccepted: s.termsAccepted || remote.termsAccepted,
      termsVersion: remote.termsVersion || s.termsVersion,
      termsAcceptedAt: remote.termsAcceptedAt ?? s.termsAcceptedAt,
      loginAt: remote.loginAt ?? s.loginAt,
      trades: hasRemote ? remote.trades : s.trades,
      plans: hasRemote ? remote.plans : s.plans,
      issuedCards: mergeIssuedCards(s.issuedCards, remote.issuedCards),
      issueBaseline: mergeIssueBaseline(s.issueBaseline, remote.issueBaseline),
    }));
  }, []);

  const runPush = useCallback(async () => {
    const status = await pushAccount(stateRef.current);
    if (status === "error") {
      setActionError(true);
      setToast({ message: "클라우드 저장에 실패했어요", kind: "err" });
    }
    if (status === "ok") setActionError(false);
    if (status !== "off") setCloudStatus(status);
    return status;
  }, []);

  useEffect(() => {
    if (!hydrated || !state.loggedIn) return;
    runPull(state.accountId, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, state.loggedIn, state.accountId]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    if (!state.loggedIn) return;
    const t = setTimeout(() => {
      void runPush();
    }, 400);
    return () => clearTimeout(t);
  }, [hydrated, state, runPush]);

  const tryIssue = useCallback(async (trades: Trade[], baseline: { buy: number; sell: number }) => {
    const nextCards: IssuedCard[] = [];
    const nextBaseline = { ...baseline };
    for (const side of ["buy", "sell"] as Side[]) {
      const count = sideTrades(trades, side).length;
      if (!shouldAttemptIssue(count, baseline[side])) continue;
      const cands = applyIssueCooldown(detectCandidates(trades, side), stateRef.current.issuedCards);
      if (!cands.length) continue;
      const c = cands[0];
      const copy = await copyForCandidate(c);
      nextCards.push(candidateToCard(c, copy.n1, copy.n2));
      nextBaseline[side] = count;
    }
    if (!nextCards.length) return;
    const before = stateRef.current.issuedCards;
    setState((s) => ({
      ...s,
      issuedCards: [...s.issuedCards, ...nextCards],
      issueBaseline: nextBaseline,
    }));
    for (const card of nextCards) {
      const firstForSide = !before.some((c) => c.side === card.side);
      if (!firstForSide) continue;
      track("insight_first_generated", {
        insight_id: card.id,
        pair_id: pairId(card.side, card.reasonGroup, card.moodMeta),
        trade_type: card.side,
        pair_count: card.count,
        trade_type_record_count_at_generation: sideTrades(trades, card.side).length,
        trigger_record_id: card.relatedTradeIds[0],
        taxonomy_version: TAXONOMY_VERSION,
        rule_version: RULE_VERSION,
        insight_type: "repeated_pair",
      });
    }
  }, []);

  const login = useCallback((opts?: { kakaoId?: string; nickname?: string; email?: string; accountId?: string; passwordHash?: string }) => {
    touch();
    const nextId = opts?.accountId
      ? opts.accountId
      : opts?.kakaoId
        ? `kakao_${opts.kakaoId}`
        : opts?.email
          ? `email_${opts.email.toLowerCase()}`
          : stateRef.current.accountId;
    setState((s) => {
      const sameKakao = Boolean(opts?.kakaoId && s.kakaoId === opts.kakaoId);
      const sameEmail = Boolean(opts?.email && s.email === opts.email);
      const same = sameKakao || sameEmail || (opts?.accountId && s.accountId === opts.accountId);
      return {
        ...s,
        accountId: nextId,
        kakaoId: opts?.kakaoId ?? s.kakaoId,
        email: opts?.email ?? s.email,
        passwordHash: opts?.passwordHash ?? s.passwordHash,
        nickname: opts?.nickname && opts.nickname !== "회원" ? opts.nickname : same && s.nickname !== "회원" ? s.nickname : opts?.kakaoId ? "회원" : opts?.nickname || s.nickname,
        loggedIn: true,
        loginAt: Date.now(),
        ...(!same && (opts?.kakaoId || opts?.email) ? { trades: [], plans: [], issuedCards: [], issueBaseline: { buy: 0, sell: 0 } } : {}),
      };
    });
    if (opts?.kakaoId || opts?.email || opts?.accountId) void runPull(nextId);
    setAnalyticsUserId(nextId);
  }, [runPull]);

  const completeSignup = useCallback(
    async (opts: { accountId: string; nickname: string; email?: string; kakaoId?: string; passwordHash?: string }) => {
      touch();
      const next: AppState = {
        ...stateRef.current,
        accountId: opts.accountId,
        kakaoId: opts.kakaoId ?? null,
        email: opts.email ?? stateRef.current.email,
        passwordHash: opts.passwordHash ?? stateRef.current.passwordHash,
        nickname: opts.nickname,
        loggedIn: true,
        loginAt: Date.now(),
        onboarded: true,
        seenOnboarding: true,
        seenWelcome: true,
        termsAccepted: true,
        termsVersion: TERMS_VERSION,
        termsAcceptedAt: Date.now(),
      };
      const status = await pushAccount(next);
      stateRef.current = next;
      skipPush.current = true;
      setState(next);
      if (status === "error") {
        setActionError(true);
        setToast({ message: "클라우드 저장에 실패했어요", kind: "err" });
      }
      if (status === "ok") setActionError(false);
      if (status !== "off") setCloudStatus(status);
      setAnalyticsUserId(opts.accountId);
      const method = opts.kakaoId ? "kakao" : opts.email ? "email" : "unknown";
      const source =
        (typeof window !== "undefined" && sessionStorage.getItem("signup_source")) ||
        (typeof window !== "undefined" && sessionStorage.getItem("kakao_intent") === "signup" ? "onboarding" : "login_screen");
      track("signup_complete", {
        signup_method: method,
        onboarding_session_id: typeof window !== "undefined" ? sessionStorage.getItem("inplot:ga:onboarding_session") : undefined,
        signup_source: source,
        screen_name: "signup",
      });
      return status;
    },
    []
  );

  const logout = useCallback(() => {
    touch();
    setAnalyticsUserId(null);
    setState((s) => ({
      ...empty(),
      seenOnboarding: s.seenOnboarding,
      loggedIn: false,
    }));
  }, []);

  const withdraw = useCallback(() => {
    const cur = stateRef.current;
    removeRegistry({ id: cur.accountId, email: cur.email, kakaoId: cur.kakaoId });
    void deleteAccount(cur.accountId);
    touch();
    const fresh = empty();
    setState(fresh);
    localStorage.removeItem(KEY);
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      hydrated,
      cloudStatus,
      querying,
      actionError,
      toast,
      login,
      completeSignup,
      logout,
      withdraw,
      setNickname: (name) => {
        touch();
        setState((s) => ({ ...s, nickname: name.trim() || s.nickname }));
      },
      acceptTerms: () => {
        touch();
        setState((s) => ({ ...s, termsAccepted: true, termsVersion: TERMS_VERSION, termsAcceptedAt: Date.now() }));
      },
      markOnboarded: () => {
        touch();
        setState((s) => ({ ...s, onboarded: true, seenOnboarding: true }));
      },
      skipOnboarding: () => {
        touch();
        setState((s) => ({ ...s, seenOnboarding: true }));
      },
      addTrade: (draft) => {
        if (!draft.stock) return null;
        const price = Number(draft.price.replace(/,/g, ""));
        const qty = Number(draft.qty.replace(/,/g, ""));
        if (!Number.isFinite(price) || price <= 0) return null;
        if (!Number.isFinite(qty) || qty <= 0) return null;
        const snap = snapshotForStock(stateRef.current.plans, draft.stock.code, draft.stock.market);
        const trade: Trade = {
          id: uid("tr"),
          planId: draft.planId,
          side: draft.side,
          stockCode: draft.stock.code,
          stockName: draft.stock.name,
          market: draft.stock.market,
          price,
          qty,
          tradedAt: draft.tradedAt,
          tradedTime: draft.tradedTime,
          reasons: draft.reasons,
          moods: draft.moods,
          isPractice: draft.isPractice,
          createdAt: Date.now(),
          planSnapshot: snap,
          hiddenPlan: {},
        };
        touch();
        setState((s) => {
          const trades = [trade, ...s.trades];
          return {
            ...s,
            trades,
            recentSearches: [draft.stock!, ...s.recentSearches.filter((x) => !(x.code === draft.stock!.code && x.market === draft.stock!.market))].slice(0, 5),
          };
        });
        setToast({ message: draft.isPractice ? "연습 기록을 저장했어요" : "매매 기록을 저장했어요", kind: "ok" });
        if (!draft.isPractice) {
          const nextTrades = [trade, ...stateRef.current.trades.filter((t) => !t.isPractice)];
          const real = nextTrades.filter((t) => !t.isPractice);
          const sideSeq = real.filter((t) => t.side === trade.side).length;
          track("record_save_success", {
            record_id: trade.id,
            record_session_id: recordSessionId(),
            trade_type: trade.side,
            stock_code: trade.stockCode,
            trade_date: `${trade.tradedAt} ${trade.tradedTime || "00-00"}`.replace(":", "-"),
            reason_category_ids: trade.reasons.map((r) => r.meta || r.label),
            reason_count: trade.reasons.length,
            state_category_ids: trade.moods.map((m) => m.meta || m.label),
            state_count: trade.moods.length,
            reason_state_pairs: trade.reasons.flatMap((r) => trade.moods.map((m) => `${r.group || r.meta}|${m.meta}`)),
            record_sequence: real.length,
            trade_type_record_sequence: sideSeq,
            elapsed_active_sec: recordElapsedSec(),
            plan_snapshot_exists: Boolean(snap && (trade.side === "buy" ? snap.buy : snap.sell)),
            impulsive_grade: "none",
            taxonomy_version: TAXONOMY_VERSION,
            rule_version: RULE_VERSION,
            screen_name: "record_save",
          });
          if (snap && (trade.side === "buy" ? snap.buy : snap.sell)) {
            const fieldCount = trade.side === "buy" ? 2 : 2;
            track("plan_snapshot_save_success", {
              plan_id: trade.planId,
              record_id: trade.id,
              snapshot_id: `${trade.id}_snap`,
              snapshot_field_count: fieldCount,
            });
          }
          if (sideSeq === 3) {
            track("insight_eligible", {
              trade_type: trade.side,
              trade_type_record_count: sideSeq,
              trigger_record_id: trade.id,
              eligible_at: new Date().toISOString(),
            });
          }
          void tryIssue(nextTrades, stateRef.current.issueBaseline);
        }
        return trade;
      },
      updateTrade: (id, draft) => {
        if (!draft.stock) return null;
        const price = Number(draft.price.replace(/,/g, ""));
        const qty = Number(draft.qty.replace(/,/g, ""));
        if (!Number.isFinite(price) || price <= 0) return null;
        if (!Number.isFinite(qty) || qty <= 0) return null;
        let next: Trade | null = null;
        touch();
        setState((s) => ({
          ...s,
          trades: s.trades.map((t) => {
            if (t.id !== id) return t;
            next = {
              ...t,
              side: draft.side,
              stockCode: draft.stock!.code,
              stockName: draft.stock!.name,
              market: draft.stock!.market,
              price,
              qty,
              tradedAt: draft.tradedAt,
              tradedTime: draft.tradedTime,
              reasons: draft.reasons,
              moods: draft.moods,
              planSnapshot: t.planSnapshot,
            };
            return next;
          }),
        }));
        setToast({ message: "매매 정보를 수정했어요", kind: "ok" });
        return next;
      },
      deleteTrade: (id) => {
        touch();
        setState((s) => ({ ...s, trades: s.trades.filter((t) => t.id !== id) }));
      },
      hidePlanOnTrade: (tradeId, side) => {
        touch();
        setState((s) => ({
          ...s,
          trades: s.trades.map((t) => (t.id === tradeId ? { ...t, hiddenPlan: { ...t.hiddenPlan, [side]: true } } : t)),
        }));
      },
      attachPlanToTrade: (tradeId, piece) => {
        touch();
        setState((s) => ({
          ...s,
          trades: s.trades.map((t) => {
            if (t.id !== tradeId) return t;
            const hiddenPlan = { ...t.hiddenPlan };
            if (piece.buy) delete hiddenPlan.buy;
            if (piece.sell) delete hiddenPlan.sell;
            return { ...t, planSnapshot: { ...(t.planSnapshot || {}), ...piece }, hiddenPlan };
          }),
        }));
      },
      addPlan: (plan) => {
        const row: Plan = { ...plan, id: uid("pl"), createdAt: Date.now(), updatedAt: Date.now() };
        touch();
        setState((s) => {
          const plans = [row, ...s.plans.filter((p) => !(p.stockCode === plan.stockCode && p.market === plan.market && p.side === plan.side))];
          return { ...s, plans };
        });
        setToast({ message: "계획을 등록했어요", kind: "ok" });
        track("plan_save_success", {
          plan_id: row.id,
          plan_session_id: planSessionId(),
          stock_code: row.stockCode,
          has_buy_price: row.buyMin != null && row.buyMax != null,
          has_stop_price: row.stopLoss != null,
          has_target_price: row.takeProfit != null,
          screen_name: "plan_new",
        });
        return row;
      },
      updatePlan: (id, patch) => {
        let row: Plan | undefined;
        touch();
        setState((s) => {
          const plans = s.plans.map((p) => {
            if (p.id !== id) return p;
            row = { ...p, ...patch, updatedAt: Date.now() };
            return row;
          });
          return { ...s, plans };
        });
        setToast({ message: "계획을 저장했어요", kind: "ok" });
        if (row) {
          track("plan_save_success", {
            plan_id: row.id,
            plan_session_id: planSessionId(),
            stock_code: row.stockCode,
            has_buy_price: row.buyMin != null && row.buyMax != null,
            has_stop_price: row.stopLoss != null,
            has_target_price: row.takeProfit != null,
            screen_name: "plan_edit",
          });
        }
      },
      deletePlan: (id) => {
        touch();
        setState((s) => ({
          ...s,
          plans: s.plans.filter((p) => p.id !== id),
        }));
      },
      rememberSearch: (stock) => {
        touch();
        setState((s) => ({
          ...s,
          recentSearches: [stock, ...s.recentSearches.filter((x) => !(x.code === stock.code && x.market === stock.market))].slice(0, 5),
        }));
      },
      markCardsRead: () => {
        setState((s) => {
          if (s.issuedCards.every((c) => c.read)) return s;
          return { ...s, issuedCards: s.issuedCards.map((c) => ({ ...c, read: true })) };
        });
      },
      markWelcomeSeen: () => {
        touch();
        setState((s) => ({ ...s, seenWelcome: true }));
      },
      showToast: (message, kind = "info") => setToast({ message, kind }),
      clearToast: () => setToast(null),
      retryPull: () => {
        if (stateRef.current.loggedIn) void runPull(stateRef.current.accountId);
      },
      retryPush: () => {
        void runPush();
      },
    }),
    [state, hydrated, cloudStatus, querying, actionError, toast, login, completeSignup, logout, withdraw, runPull, runPush, tryIssue]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

export function emptyDraft(side: DraftTrade["side"], stock: Stock | null = null, isPractice = false): DraftTrade {
  return {
    side,
    stock,
    price: "0",
    qty: "0",
    tradedAt: todayKey(),
    tradedTime: "",
    reasons: [],
    moods: [],
    planId: null,
    isPractice,
  };
}

export function draftFromTrade(trade: Trade, stock: Stock): DraftTrade {
  return {
    side: trade.side,
    stock,
    price: String(trade.price),
    qty: String(trade.qty),
    tradedAt: trade.tradedAt,
    tradedTime: trade.tradedTime,
    reasons: trade.reasons,
    moods: trade.moods,
    planId: trade.planId,
    isPractice: trade.isPractice,
  };
}
