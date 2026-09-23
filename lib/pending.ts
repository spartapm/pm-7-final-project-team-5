import type { DraftTrade, Plan, Side } from "./types";

const KEY = "inplot:pending-save";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type PendingTrade = {
  kind: "trade";
  savedAt: number;
  draft: DraftTrade;
};

export type PendingPlan = {
  kind: "plan";
  savedAt: number;
  payload: Omit<Plan, "id" | "createdAt" | "updatedAt">;
};

export type PendingSave = PendingTrade | PendingPlan;

function read(): PendingSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingSave;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setPendingTrade(draft: DraftTrade) {
  const payload: PendingTrade = { kind: "trade", savedAt: Date.now(), draft };
  localStorage.setItem(KEY, JSON.stringify(payload));
}

export function setPendingPlan(payload: PendingPlan["payload"]) {
  const next: PendingPlan = { kind: "plan", savedAt: Date.now(), payload };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function takePending(): PendingSave | null {
  const cur = read();
  localStorage.removeItem(KEY);
  return cur;
}

export function peekPending(): PendingSave | null {
  return read();
}

export function pendingAuthPath() {
  return "/login?next=pending";
}

export function guestSaveLabel(side?: Side) {
  return side ? "로그인/회원가입하고 저장하기" : "로그인/회원가입하고 저장하기";
}
