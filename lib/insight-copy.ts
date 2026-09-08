import type { CategoryPick, Side } from "./types";

export const EXCLUDED_MOOD_META = "(집계 제외)";
export const EXCLUDED_MOOD_LABEL = "다른 데 돈이 필요했다";

export const MOOD_MAP: Record<string, { side: Side; meta: string; expose: string }> = {
  "계획대로여서 특별한 느낌은 없었다": { side: "buy", meta: "중립", expose: "정해둔 매수 계획대로, 큰 동요 없이 진행하는 경향이 보여요" },
  "많이 떨어져 있어서 지금이 기회라고 봤다": { side: "buy", meta: "저가 착각, 물타기", expose: "가격이 많이 떨어졌을 때 매수하는 경향이 보여요" },
  "오르는 중이었지만 더 갈 거라고 봤다": { side: "buy", meta: "추세 과잉확신", expose: "오르는 흐름을 보고 더 오를 거라 판단해 매수하는 경우가 있었어요" },
  "지금 아니면 놓칠 것 같았다": { side: "buy", meta: "급등 추격, 조급함", expose: "가격이 빠르게 움직일 때 놓치지 않으려 매수하는 경향이 보여요" },
  "앞서 본 손실을 빨리 되돌리고 싶었다": { side: "buy", meta: "손실 만회 매매", expose: "이전 손실 이후 다시 매수로 이어지는 흐름이 있었어요" },
  "다들 사는 분위기라 나만 빠지는 것 같았다": { side: "buy", meta: "군집 행동", expose: "다른 사람들이 많이 사는 시점에 함께 매수하는 경우가 있었어요" },
  "확신은 없었지만 일단 들어가 봤다": { side: "buy", meta: "무지성", expose: "뚜렷한 확신 없이 매수한 경우도 있었어요" },
  "계획한 지점이라 담담했다": { side: "sell", meta: "중립", expose: "정해둔 매도 계획대로, 큰 동요 없이 진행하는 경향이 보여요" },
  "가격이 급하게 떨어지는 상황에서 더 떨어질까 봐 무서웠다": { side: "sell", meta: "공포 매도", expose: "가격이 빠르게 떨어질 때 매도하는 경향이 보여요" },
  "지금 이익이 사라질까 봐 조급했다": { side: "sell", meta: "수익 조기 실현", expose: "이익이 난 상태에서 빠르게 매도를 결정하는 경우가 많았어요" },
  "산 가격까지 다시 올라와서 마음이 놓였다": { side: "sell", meta: "원금 회복 심리", expose: "매수한 가격 부근으로 돌아왔을 때 매도하는 흐름이 있었어요" },
  "버티면 오를 줄 알았는데 결국 접었다": { side: "sell", meta: "손절 지연 후 항복", expose: "예상보다 오래 보유하다 매도로 이어지는 경우가 있었어요" },
  "왜 팔았는지 나도 잘 모르겠다": { side: "sell", meta: "무지성", expose: "뚜렷한 이유 없이 매도한 경우도 있었어요" },
  "다른 데 돈이 필요했다": { side: "sell", meta: EXCLUDED_MOOD_META, expose: "" },
};

export const HIDDEN_TAGS = [
  "저가 착각",
  "물타기",
  "추세 과잉확신",
  "급등 추격",
  "조급함",
  "군집 행동",
  "군집행동",
  "손실 만회 매매",
  "무지성",
  "공포 매도",
  "수익 조기 실현",
  "원금 회복 심리",
  "손절 지연 후 항복",
];

export const BANNED_WORDS = ["충동적으로", "성급하게", "실수로"];

export function isExcludedMood(pick: CategoryPick) {
  return pick.label === EXCLUDED_MOOD_LABEL || pick.meta === EXCLUDED_MOOD_META || pick.meta.includes("집계 제외");
}

export function moodMetaOf(pick: CategoryPick) {
  return MOOD_MAP[pick.label]?.meta || pick.meta;
}

export function moodExpose(pick: CategoryPick) {
  return MOOD_MAP[pick.label]?.expose || "";
}

export function endingFor(n: number) {
  return n >= 6 ? "한 패턴이 반복되고 있어요" : "한 경향이 보여요";
}

export function swapEnding(sentence: string, ending: string) {
  const trimmed = sentence.replace(/[다요]$/, "").replace(/(하는 경향이 보여요|하는 경우가 있었어요|하는 흐름이 있었어요|한 패턴이 반복되고 있어요|경향이 보여요|경우가 있었어요|흐름이 있었어요|패턴이 반복되고 있어요)$/, "");
  return `${trimmed}${ending}`;
}

export function fallbackNarrative1(moodLabel: string, n: number) {
  const expose = MOOD_MAP[moodLabel]?.expose || "비슷한 판단이 반복되는 경향이 보여요";
  return swapEnding(expose, endingFor(n));
}

export function fallbackNarrative2(moodLabel: string, n: number) {
  return fallbackNarrative1(moodLabel, n);
}
