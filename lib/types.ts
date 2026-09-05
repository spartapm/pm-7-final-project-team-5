export type Side = "buy" | "sell";
export type Market = "KOSPI" | "KOSDAQ" | "NAS" | "NYS" | string;
export type ToastKind = "ok" | "err" | "info";

export type Stock = {
  code: string;
  name: string;
  market: Market;
  marketName: string;
};

export type CategoryPick = {
  group: string | null;
  label: string;
  meta: string;
};

export type Trade = {
  id: string;
  planId: string | null;
  side: Side;
  stockCode: string;
  stockName: string;
  market: string;
  price: number;
  qty: number;
  tradedAt: string;
  tradedTime: string;
  reasons: CategoryPick[];
  moods: CategoryPick[];
  isPractice: boolean;
  createdAt: number;
};

export type Plan = {
  id: string;
  stockCode: string;
  stockName: string;
  market: string;
  targetBuy: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  memo: string;
  createdAt: number;
  updatedAt: number;
};

export type DraftTrade = {
  side: Side;
  stock: Stock | null;
  price: string;
  qty: string;
  tradedAt: string;
  tradedTime: string;
  reasons: CategoryPick[];
  moods: CategoryPick[];
  planId: string | null;
  isPractice: boolean;
};

export type InsightCopy = {
  observation: string;
  interpretation: string;
};

export type AppState = {
  accountId: string;
  kakaoId: string | null;
  nickname: string;
  loggedIn: boolean;
  loginAt: number | null;
  onboarded: boolean;
  seenOnboarding: boolean;
  termsAccepted: boolean;
  trades: Trade[];
  plans: Plan[];
  recentSearches: Stock[];
  insightCopy: Record<string, InsightCopy>;
  seenInsightKeys: string[];
  seenWelcome: boolean;
};

export const PRACTICE_STOCK: Stock = {
  code: "005930",
  name: "삼성전자",
  market: "KOSPI",
  marketName: "코스피",
};
