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

export type PlanSnapshot = {
  buy?: { min: number; max: number };
  sell?: { stopLoss: number; takeProfit: number };
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
  planSnapshot: PlanSnapshot | null;
  hiddenPlan: { buy?: boolean; sell?: boolean };
};

export type Plan = {
  id: string;
  side: Side;
  stockCode: string;
  stockName: string;
  market: string;
  buyMin: number | null;
  buyMax: number | null;
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

export type IssuedCard = {
  id: string;
  side: Side;
  issuedAt: number;
  dateKey: string;
  moodMeta: string;
  moodLabel: string;
  reasonLevel: "sub" | "group";
  reasonGroup: string;
  reasonMeta: string;
  reasonLabels: string[];
  count: number;
  windowSize: number;
  score: number;
  narrative1: string;
  narrative2: string;
  relatedTradeIds: string[];
  read: boolean;
};

export type InsightCopy = {
  observation: string;
  interpretation: string;
};

export type AppState = {
  accountId: string;
  kakaoId: string | null;
  email: string | null;
  nickname: string;
  loggedIn: boolean;
  loginAt: number | null;
  onboarded: boolean;
  seenOnboarding: boolean;
  termsAccepted: boolean;
  termsVersion: string;
  termsAcceptedAt: number | null;
  trades: Trade[];
  plans: Plan[];
  issuedCards: IssuedCard[];
  issueBaseline: { buy: number; sell: number };
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

export const TERMS_VERSION = "2026-09-01";
