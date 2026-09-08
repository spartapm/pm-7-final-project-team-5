import { isOverseas } from "./markets";

export function stripNum(v: string) {
  return v.replace(/[^\d.]/g, "");
}

export function formatGrouped(intPart: string) {
  if (!intPart) return "0";
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function sanitizePrice(raw: string, market: string) {
  const overseas = isOverseas(market);
  const cleaned = stripNum(raw);
  if (!cleaned) return overseas ? "0.00" : "0";
  const [intRaw, fracRaw = ""] = cleaned.split(".");
  const intPart = (intRaw || "0").replace(/^0+(?=\d)/, "").slice(0, overseas ? 6 : 10);
  if (!overseas) return formatGrouped(intPart || "0");
  const frac = fracRaw.slice(0, 2).padEnd(Math.min(fracRaw.length, 2), "");
  const shown = fracRaw.length ? `${intPart || "0"}.${frac.slice(0, 2)}` : intPart || "0";
  const [a, b] = shown.split(".");
  return b != null ? `${formatGrouped(a || "0")}.${b}` : formatGrouped(a || "0");
}

export function sanitizeQty(raw: string) {
  const cleaned = stripNum(raw);
  if (!cleaned) return "0";
  const [intRaw, fracRaw = ""] = cleaned.split(".");
  const intPart = (intRaw || "0").replace(/^0+(?=\d)/, "").slice(0, 5);
  if (!raw.includes(".") && !cleaned.includes(".")) return formatGrouped(intPart || "0");
  const frac = fracRaw.slice(0, 3);
  return frac.length ? `${formatGrouped(intPart || "0")}.${frac}` : formatGrouped(intPart || "0");
}

export function parseNum(v: string) {
  const n = Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

export function bumpQty(raw: string, dir: 1 | -1) {
  const n = parseNum(raw);
  const next = Number.isFinite(n) ? Math.max(0, n + dir) : dir > 0 ? 1 : 0;
  return sanitizeQty(String(next));
}

export function pricePlaceholder(market: string) {
  return isOverseas(market) ? "$0" : "0원";
}
