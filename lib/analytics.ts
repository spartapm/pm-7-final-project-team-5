export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_ID || "G-NY7WWXC28E";
export const TAXONOMY_VERSION = "v1";
export const RULE_VERSION = "v1";
export const APP_VERSION = "0.1.0";

const ANON_KEY = "inplot:ga:anonymous_id";
const SESSION_KEY = "inplot:ga:session_id";
const ONB_KEY = "inplot:ga:onboarding_session";
const ONB_START_KEY = "inplot:ga:onboarding_started_at";
const RECORD_KEY = "inplot:ga:record_session";
const RECORD_START_KEY = "inplot:ga:record_started_at";
const PLAN_KEY = "inplot:ga:plan_session";
const FIRST_INSIGHT_KEY = "inplot:ga:first_insight_viewed";
const VIEWED_INSIGHTS_KEY = "inplot:ga:viewed_insights";

type Params = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function read(key: string) {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(key) || localStorage.getItem(key) || "";
}

function writeSession(key: string, value: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, value);
}

function writeLocal(key: string, value: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

export function anonymousId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = uuid();
    writeLocal(ANON_KEY, id);
  }
  return id;
}

export function analyticsSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    writeSession(SESSION_KEY, id);
  }
  return id;
}

export function onboardingSessionId() {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(ONB_KEY);
  if (!id) {
    id = uuid();
    writeSession(ONB_KEY, id);
    writeSession(ONB_START_KEY, String(Date.now()));
  }
  return id;
}

export function elapsedActiveSec(startKey: string) {
  const raw = read(startKey);
  const start = Number(raw);
  if (!start) return 0;
  return Math.max(0, Math.round((Date.now() - start) / 1000));
}

export function startRecordSession(entrySource: string, recordCountBefore: number) {
  const id = uuid();
  writeSession(RECORD_KEY, id);
  writeSession(RECORD_START_KEY, String(Date.now()));
  writeSession("inplot:ga:record_entry", entrySource);
  track("record_start", {
    record_session_id: id,
    entry_source: entrySource,
    record_count_before: recordCountBefore,
    screen_id: entrySource === "home" ? "2-1" : "5-1",
    screen_name: entrySource === "home" ? "home" : entrySource,
  });
  return id;
}

export function ensureRecordSession(entrySource = "direct") {
  if (typeof window === "undefined") return "";
  const existing = sessionStorage.getItem(RECORD_KEY);
  if (existing) return existing;
  const id = uuid();
  writeSession(RECORD_KEY, id);
  writeSession(RECORD_START_KEY, String(Date.now()));
  writeSession("inplot:ga:record_entry", entrySource);
  return id;
}

export function recordSessionId() {
  return typeof window === "undefined" ? "" : sessionStorage.getItem(RECORD_KEY) || "";
}

export function startPlanSession(entrySource: string, stockCode?: string) {
  const id = uuid();
  writeSession(PLAN_KEY, id);
  track("plan_start", {
    plan_session_id: id,
    entry_source: entrySource,
    stock_code: stockCode || undefined,
    screen_name: "plan_start",
  });
  return id;
}

export function ensurePlanSession(entrySource = "direct") {
  if (typeof window === "undefined") return "";
  const existing = sessionStorage.getItem(PLAN_KEY);
  if (existing) return existing;
  return startPlanSession(entrySource);
}

export function planSessionId() {
  return typeof window === "undefined" ? "" : sessionStorage.getItem(PLAN_KEY) || "";
}

export function setAnalyticsUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  const apply = () => {
    if (!window.gtag) return false;
    window.gtag("set", { user_id: userId || undefined });
    window.gtag("config", GA_MEASUREMENT_ID, {
      user_id: userId || undefined,
      send_page_view: false,
      anonymize_ip: true,
    });
    return true;
  };
  if (apply()) return;
  const started = Date.now();
  const timer = window.setInterval(() => {
    if (apply() || Date.now() - started > 5000) window.clearInterval(timer);
  }, 150);
}

function flatten(value: unknown): string | number | boolean | undefined {
  if (value == null || value === "") return undefined;
  if (Array.isArray(value)) return value.map(String).join(",");
  if (typeof value === "boolean" || typeof value === "number") return value;
  return String(value);
}

export function track(name: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const payload: Record<string, string | number | boolean> = {
    event_id: uuid(),
    event_timestamp: new Date().toISOString(),
    anonymous_id: anonymousId(),
    session_id: analyticsSessionId(),
    app_version: APP_VERSION,
    platform: "web",
  };
  for (const [key, value] of Object.entries(params)) {
    const next = flatten(value);
    if (next !== undefined) payload[key] = next;
  }
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...payload });
  if (window.gtag) {
    window.gtag("event", name, payload);
  }
}

export function trackOnce(key: string, name: string, params?: Params) {
  if (typeof window === "undefined") return;
  const full = `inplot:ga:once:${key}`;
  if (sessionStorage.getItem(full)) return;
  sessionStorage.setItem(full, "1");
  track(name, params);
}

export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
    event_id: uuid(),
    platform: "web",
  });
}

export function pairId(side: string, reasonGroup: string, moodMeta: string) {
  return `${side}|${reasonGroup}|${moodMeta}`;
}

export function markInsightViewed(insightId: string) {
  if (typeof window === "undefined") return { first: false, already: true };
  const raw = localStorage.getItem(VIEWED_INSIGHTS_KEY);
  const ids = raw ? (JSON.parse(raw) as string[]) : [];
  const already = ids.includes(insightId);
  const first = !localStorage.getItem(FIRST_INSIGHT_KEY);
  if (!already) {
    ids.push(insightId);
    writeLocal(VIEWED_INSIGHTS_KEY, JSON.stringify(ids.slice(-200)));
  }
  if (first) writeLocal(FIRST_INSIGHT_KEY, insightId);
  return { first: first && !already, already };
}

export function onboardingElapsedSec() {
  return elapsedActiveSec(ONB_START_KEY);
}

export function recordElapsedSec() {
  return elapsedActiveSec(RECORD_START_KEY);
}
