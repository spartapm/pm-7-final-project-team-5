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
import { deleteAccount, pullAccount, pushAccount, type CloudStatus } from "./cloud";
import { uid, nowTime } from "./format";
import type { AppState, DraftTrade, InsightCopy, Plan, Stock, ToastKind, Trade } from "./types";

const KEY = "patternnote:v1";
const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function empty(): AppState {
  return {
    accountId: uid("acc"),
    kakaoId: null,
    nickname: "회원",
    loggedIn: false,
    loginAt: null,
    onboarded: false,
    seenOnboarding: false,
    termsAccepted: false,
    trades: [],
    plans: [],
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
    if (parsed.loggedIn && parsed.loginAt && Date.now() - parsed.loginAt > SESSION_MS) {
      return {
        ...fallback,
        ...parsed,
        accountId: parsed.accountId || fallback.accountId,
        loggedIn: false,
        loginAt: null,
        trades: (parsed.trades ?? []).map((t) => ({ ...t, tradedTime: t.tradedTime || "" })),
        recentSearches: parsed.recentSearches ?? [],
        insightCopy: parsed.insightCopy ?? {},
        seenInsightKeys: parsed.seenInsightKeys ?? [],
        seenWelcome: Boolean(parsed.seenWelcome),
      };
    }
    return {
      ...fallback,
      ...parsed,
      accountId: parsed.accountId || fallback.accountId,
      termsAccepted: Boolean(parsed.termsAccepted),
      recentSearches: parsed.recentSearches ?? [],
      insightCopy: parsed.insightCopy ?? {},
      seenInsightKeys: parsed.seenInsightKeys ?? [],
      seenWelcome: Boolean(parsed.seenWelcome),
      trades: (parsed.trades ?? []).map((t) => ({ ...t, tradedTime: t.tradedTime || "" })),
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
  login: (opts?: { kakaoId?: string; nickname?: string }) => void;
  logout: () => void;
  withdraw: () => void;
  setNickname: (name: string) => void;
  acceptTerms: () => void;
  markOnboarded: () => void;
  skipOnboarding: () => void;
  addTrade: (draft: DraftTrade) => Trade | null;
  deleteTrade: (id: string) => void;
  addPlan: (plan: Omit<Plan, "id" | "createdAt" | "updatedAt">) => Plan;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  deletePlan: (id: string) => void;
  rememberSearch: (stock: Stock) => void;
  setInsightCopy: (key: string, copy: InsightCopy) => void;
  markInsightsSeen: (keys: string[]) => void;
  markWelcomeSeen: () => void;
  showToast: (message: string, kind?: ToastKind) => void;
  clearToast: () => void;
  retryPull: () => void;
  retryPush: () => void;
};

const Ctx = createContext<Store | null>(null);

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
    setState((s) => ({
      ...s,
      kakaoId: remote.kakaoId ?? s.kakaoId,
      nickname: remote.nickname || s.nickname,
      onboarded: remote.onboarded || s.onboarded,
      loginAt: remote.loginAt ?? s.loginAt,
      trades: hasRemote ? remote.trades : s.trades,
      plans: hasRemote ? remote.plans : s.plans,
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

  const login = useCallback((opts?: { kakaoId?: string; nickname?: string }) => {
    touch();
    setState((s) => {
      const accountId = opts?.kakaoId ? `kakao_${opts.kakaoId}` : s.accountId;
      return {
        ...s,
        accountId,
        kakaoId: opts?.kakaoId ?? s.kakaoId,
        nickname: opts?.nickname || s.nickname,
        loggedIn: true,
        loginAt: Date.now(),
      };
    });
  }, []);

  const logout = useCallback(() => {
    touch();
    setState((s) => ({ ...s, loggedIn: false, loginAt: null }));
  }, []);

  const withdraw = useCallback(() => {
    const id = stateRef.current.accountId;
    void deleteAccount(id);
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
      logout,
      withdraw,
      setNickname: (name) => {
        touch();
        setState((s) => ({ ...s, nickname: name.trim() || s.nickname }));
      },
      acceptTerms: () => {
        touch();
        setState((s) => ({ ...s, termsAccepted: true }));
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
        };
        touch();
        setState((s) => ({
          ...s,
          trades: [trade, ...s.trades],
          recentSearches: [draft.stock!, ...s.recentSearches.filter((x) => !(x.code === draft.stock!.code && x.market === draft.stock!.market))].slice(0, 5),
        }));
        setToast({ message: draft.isPractice ? "연습 기록을 저장했어요" : "매매 기록을 저장했어요", kind: "ok" });
        return trade;
      },
      deleteTrade: (id) => {
        touch();
        setState((s) => ({ ...s, trades: s.trades.filter((t) => t.id !== id) }));
      },
      addPlan: (plan) => {
        const row: Plan = { ...plan, id: uid("pl"), createdAt: Date.now(), updatedAt: Date.now() };
        touch();
        setState((s) => ({ ...s, plans: [row, ...s.plans] }));
        setToast({ message: "계획을 등록했어요", kind: "ok" });
        return row;
      },
      updatePlan: (id, patch) => {
        touch();
        setState((s) => ({
          ...s,
          plans: s.plans.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
        }));
      },
      deletePlan: (id) => {
        touch();
        setState((s) => ({
          ...s,
          plans: s.plans.filter((p) => p.id !== id),
          trades: s.trades.map((t) => (t.planId === id ? { ...t, planId: null } : t)),
        }));
      },
      rememberSearch: (stock) => {
        touch();
        setState((s) => ({
          ...s,
          recentSearches: [stock, ...s.recentSearches.filter((x) => !(x.code === stock.code && x.market === stock.market))].slice(0, 5),
        }));
      },
      setInsightCopy: (key, copy) => {
        touch();
        setState((s) => ({ ...s, insightCopy: { ...s.insightCopy, [key]: copy } }));
      },
      markInsightsSeen: (keys) => {
        setState((s) => {
          if (keys.every((k) => s.seenInsightKeys.includes(k))) return s;
          return { ...s, seenInsightKeys: [...new Set([...s.seenInsightKeys, ...keys])] };
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
    [state, hydrated, cloudStatus, querying, actionError, toast, login, logout, withdraw, runPull, runPush]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}

export function emptyDraft(side: DraftTrade["side"], stock: Stock | null = null, isPractice = false): DraftTrade {
  const d = new Date();
  const tradedAt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    side,
    stock,
    price: "",
    qty: "",
    tradedAt,
    tradedTime: nowTime(),
    reasons: [],
    moods: [],
    planId: null,
    isPractice,
  };
}
