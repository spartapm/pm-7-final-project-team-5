export const OVERSEAS = new Set(["NAS", "NYS", "AMS", "HKS", "TSE", "SHS"]);

export function isOverseas(market: string) {
  return OVERSEAS.has(market);
}

export function isKorea(market: string) {
  return market === "KOSPI" || market === "KOSDAQ";
}

export function currencyLabel(market: string) {
  return isOverseas(market) ? "USD" : "KRW";
}

export function priceUnit(market: string) {
  return isOverseas(market) ? "달러" : "원";
}

export function currencyHint(market: string) {
  return isOverseas(market) ? "종목 통화 단위 USD · $ (자동)" : "종목 통화 단위 KRW · 원 (자동)";
}
