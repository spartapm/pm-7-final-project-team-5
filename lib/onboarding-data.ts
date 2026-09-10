import type { CategoryPick } from "./types";

export const PRACTICE = {
  samsung: {
    name: "삼성전자",
    code: "005930",
    side: "매수" as const,
    price: "250,000원",
    qty: "10주",
    situation: "시장이 크게 흔들리면서 주가가 며칠 만에 많이 내려왔어요. 당신은 지금이 기회라고 생각했어요.",
    reasons: ["차트를 보고 · 차트에서 자주 멈추던 가격대를 뚫고 움직여서", "차트를 보고 · 거래량이 갑자기 크게 늘거나 줄어서"],
    moods: ["많이 떨어져 있어서 지금이 기회라고 봤다", "지금 아니면 놓칠 것 같았다"],
  },
  kakao: {
    name: "카카오",
    code: "035720",
    side: "매수" as const,
    price: "35,000원",
    qty: "10주",
    situation: "관심 있게 보던 종목이 실적 발표 이후 오히려 크게 빠졌어요. 당신은 저가 매수 기회라고 판단했어요.",
    reasons: ["관련 뉴스를 보고 · 업종이나 테마가 뜬다는 뉴스를 보고", "관련 뉴스를 보고 · 실적이나 공시가 나와서"],
    moods: ["오르는 중이었지만 더 갈 거라고 봤다", "많이 떨어져 있어서 지금이 기회라고 봤다"],
  },
  naver: {
    name: "NAVER",
    code: "035420",
    side: "매수" as const,
    price: "210,000원",
    qty: "10주",
    situation:
      "오랫동안 그 가격대를 못 뚫고 있던 종목이었는데, 마침 가격이 크게 빠지면서 오랫동안 막혀있던 가격대를 넘어섰어요. 당신은 지금이 아니면 이 기회를 놓칠 것 같았어요.",
    reasonsDefault: [
      { group: "차트를 보고", label: "차트에서 자주 멈추던 가격대를 뚫고 움직여서", meta: "차트 패턴(지지·저항, 돌파)" },
    ] as CategoryPick[],
    moodsDefault: [
      { group: null, label: "많이 떨어져 있어서 지금이 기회라고 봤다", meta: "저가 착각, 물타기" },
      { group: null, label: "지금 아니면 놓칠 것 같았다", meta: "급등 추격, 조급함" },
    ] as CategoryPick[],
  },
};

export const SAMPLE_INSIGHT = {
  narrative1: "차트에서 지지선 근처라고 판단했을 때, 가격이 떨어진 상태에서 매수하는 경향이 보여요",
  narrative2: "지지선 근처에서 반등을 기다렸던 흐름이 한 번이 아니라 여러 하락 구간에서 반복되고 있어요",
  policy: "기록 3개가 쌓일 때마다 새 카드 발행을 시도해요",
};
