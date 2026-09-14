import { isOverseas } from "./markets";

export function stripNum(v: string) {
  return v.replace(/[^\d.]/g, "");
}

export function formatGrouped(intPart: string) {
  if (!intPart) return "0";
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function capPriceRaw(raw: string, market: string) {
  const overseas = isOverseas(market);
  const trailingDot = overseas && raw.replace(/,/g, "").endsWith(".");
  const cleaned = stripNum(raw);
  const [intRaw = "", fracRaw = ""] = cleaned.split(".");
  const intPart = (intRaw || "").replace(/\D/g, "").slice(0, overseas ? 6 : 10);
  if (!overseas) return intPart || "0";
  const frac = fracRaw.replace(/\D/g, "").slice(0, 2);
  if (trailingDot && !frac) return `${intPart || "0"}.`;
  return cleaned.includes(".") ? `${intPart || "0"}.${frac}` : intPart || "0";
}

export function capQtyRaw(raw: string) {
  const trailingDot = raw.replace(/,/g, "").endsWith(".");
  const cleaned = stripNum(raw);
  const [intRaw = "", fracRaw = ""] = cleaned.split(".");
  const intPart = (intRaw || "").replace(/\D/g, "").slice(0, 5);
  const frac = fracRaw.replace(/\D/g, "").slice(0, 3);
  if (trailingDot && !frac) return `${intPart || "0"}.`;
  return cleaned.includes(".") ? `${intPart || "0"}.${frac}` : intPart || "0";
}

export function sanitizePrice(raw: string, market: string) {
  const overseas = isOverseas(market);
  const capped = capPriceRaw(raw, market);
  if (!capped || capped === ".") return overseas ? "0." : "0";
  const [intRaw, fracRaw] = capped.split(".");
  const intPart = (intRaw || "0").replace(/^0+(?=\d)/, "") || "0";
  if (!overseas) return formatGrouped(intPart);
  if (capped.endsWith(".") && fracRaw == null) return `${formatGrouped(intPart)}.`;
  if (fracRaw != null) return `${formatGrouped(intPart)}.${fracRaw.slice(0, 2)}`;
  return formatGrouped(intPart);
}

export function sanitizeQty(raw: string) {
  const capped = capQtyRaw(raw);
  if (!capped || capped === ".") return "0";
  const [intRaw, fracRaw] = capped.split(".");
  const intPart = (intRaw || "0").replace(/^0+(?=\d)/, "") || "0";
  if (capped.endsWith(".") && fracRaw == null) return `${formatGrouped(intPart)}.`;
  if (fracRaw != null) return `${formatGrouped(intPart)}.${fracRaw.slice(0, 3)}`;
  return formatGrouped(intPart);
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

export function displayPriceValue(value: string, market: string) {
  if (isOverseas(market)) {
    const shown = value.replace(/^\$/, "") || "0";
    return shown.startsWith("$") ? shown : `$${shown}`;
  }
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "0원";
  return `${Number(digits).toLocaleString("ko-KR")}원`;
}
