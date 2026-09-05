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
