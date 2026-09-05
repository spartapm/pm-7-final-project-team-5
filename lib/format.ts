import { isOverseas } from "./markets";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatPrice(price: number, market: string) {
  if (isOverseas(market)) {
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
  }
  return `${Math.round(price).toLocaleString("ko-KR")}원`;
}

export function formatWhen(date: string, time?: string) {
  if (!time) return date;
  return `${date} · ${time}`;
}

export function needsNickname(nickname: string) {
  const n = nickname.trim();
  return !n || n === "회원";
}

export function afterAuthPath(nickname: string, seenWelcome: boolean) {
  if (needsNickname(nickname)) return "/signup/nickname";
  if (!seenWelcome) return "/welcome";
  return "/home";
}

export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatQty(qty: number) {
  if (Number.isInteger(qty)) return `${qty}주`;
  return `${qty}주`;
}

export function monthKey(isoDate: string) {
  return isoDate.slice(0, 7);
}

export function thisMonth() {
  return todayKey().slice(0, 7);
}

export function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  if (/^[A-Za-z]/.test(trimmed)) return trimmed[0]!.toUpperCase();
  return trimmed.slice(0, 1);
}

export function weekDays(from = new Date()) {
  const names = ["일", "월", "화", "수", "목", "금", "토"];
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push({
      key: `${y}-${m}-${day}`,
      date: d.getDate(),
      dow: names[d.getDay()]!,
      today: i === 0,
    });
  }
  return days;
}

export function sideLabel(side: "buy" | "sell") {
  return side === "buy" ? "매수" : "매도";
}
