import type { CategoryPick, Side } from "./types";

export const EXCLUDED_MOOD_META = "(집계 제외)";
export const EXCLUDED_MOOD_LABEL = "다른 데 돈이 필요했다";

export const MOOD_MAP: Record<string, { side: Side; meta: string; expose: string; chart: string }> = {
  "계획대로여서 특별한 느낌은 없었다": { side: "buy", meta: "중립", expose: "정해둔 매수 계획대로, 큰 동요 없이 진행하는 경향이 보여요", chart: "계획대로 진행" },
  "많이 떨어져 있어서 지금이 기회라고 봤다": { side: "buy", meta: "저가 착각, 물타기", expose: "가격이 많이 떨어졌을 때 매수하는 경향이 보여요", chart: "저가 진입 판단" },
  "오르는 중이었지만 더 갈 거라고 봤다": { side: "buy", meta: "추세 과잉확신", expose: "오르는 흐름을 보고 더 오를 거라 판단해 매수하는 경우가 있었어요", chart: "상승 지속 기대" },
  "지금 아니면 놓칠 것 같았다": { side: "buy", meta: "급등 추격, 조급함", expose: "가격이 빠르게 움직일 때 놓치지 않으려 매수하는 경향이 보여요", chart: "타이밍 놓칠 우려" },
  "앞서 본 손실을 빨리 되돌리고 싶었다": { side: "buy", meta: "손실 만회 매매", expose: "이전 손실 이후 다시 매수로 이어지는 흐름이 있었어요", chart: "손실 회복 기대" },
  "다들 사는 분위기라 나만 빠지는 것 같았다": { side: "buy", meta: "군집 행동", expose: "다른 사람들이 많이 사는 시점에 함께 매수하는 경우가 있었어요", chart: "시장 분위기 영향" },
  "확신은 없었지만 일단 들어가 봤다": { side: "buy", meta: "무지성", expose: "뚜렷한 확신 없이 매수한 경우도 있었어요", chart: "확신 없이 진입" },
  "계획한 지점이라 담담했다": { side: "sell", meta: "중립", expose: "정해둔 매도 계획대로, 큰 동요 없이 진행하는 경향이 보여요", chart: "계획대로 진행" },
  "가격이 급하게 떨어지는 상황에서 더 떨어질까 봐 무서웠다": { side: "sell", meta: "공포 매도", expose: "가격이 빠르게 떨어질 때 매도하는 경향이 보여요", chart: "추가 하락 우려" },
  "지금 이익이 사라질까 봐 조급했다": { side: "sell", meta: "수익 조기 실현", expose: "이익이 난 상태에서 빠르게 매도를 결정하는 경우가 많았어요", chart: "이익 감소 우려" },
  "산 가격까지 다시 올라와서 마음이 놓였다": { side: "sell", meta: "원금 회복 심리", expose: "매수한 가격 부근으로 돌아왔을 때 매도하는 흐름이 있었어요", chart: "본전 회복 안도" },
  "버티면 오를 줄 알았는데 결국 접었다": { side: "sell", meta: "손절 지연 후 항복", expose: "예상보다 오래 보유하다 매도로 이어지는 경우가 있었어요", chart: "반등 기대 무산" },
  "왜 팔았는지 나도 잘 모르겠다": { side: "sell", meta: "무지성", expose: "뚜렷한 이유 없이 매도한 경우도 있었어요", chart: "판단 근거 불명확" },
  "다른 데 돈이 필요했다": { side: "sell", meta: EXCLUDED_MOOD_META, expose: "", chart: "자금 필요" },
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
export const VAGUE_POINTERS = [
  "이런 판단이",
  "비슷한 흐름",
  "비슷한 이유",
  "비슷한 마음",
  "비슷한 패턴",
  "이런 선택이",
  "이런 흐름이",
  "이런 마음이",
  "이런 판단으로",
  "비슷한 판단으로",
  "그런 판단으로",
  "이렇게",
  "그렇게",
  "이런 식으로",
];

export const NARRATIVE2_SHOTS = [
  "가격이 떨어진 구간에서 지지선 부근 신호를 근거로 매수를 결정하는 패턴이 여러 하락 국면에서 반복되는 경향이 보여요",
  "차트나 거래량에서 나타난 신호를 보고 방향 전환을 감지했다고 판단되면, 가격이 급락하는 상황에서 곧바로 매도로 이어지는 패턴이 여러 하락 구간에서 반복되는 경향이 보여요",
  "커뮤니티나 지인에게 들은 정보를 접한 직후, 다른 사람들이 몰리는 시점에 맞춰 매수로 이어지는 흐름이 여러 차례 반복되는 경향이 보여요",
  "수익이 발생한 구간에서 차트 신호를 근거로 매도 타이밍을 잡는 패턴이 여러 거래에서 반복되는 경향이 보여요",
];

export function isExcludedMood(pick: CategoryPick) {
  return pick.label === EXCLUDED_MOOD_LABEL || pick.meta === EXCLUDED_MOOD_META || pick.meta.includes("집계 제외");
}

export function moodMetaOf(pick: CategoryPick) {
  return MOOD_MAP[pick.label]?.meta || pick.meta;
}

export function moodChartOf(pick: CategoryPick) {
  return MOOD_MAP[pick.label]?.chart || pick.meta || pick.label;
}

export function moodExpose(pick: CategoryPick) {
  return MOOD_MAP[pick.label]?.expose || "";
}

export function endingFor(n: number) {
  return n >= 6 ? "패턴이 반복되고 있어요" : "경향이 보여요";
}

export function swapEnding(sentence: string, ending: string) {
  const trimmed = sentence.replace(/[다요]$/, "").replace(/(하는 경향이 보여요|하는 경우가 있었어요|하는 흐름이 있었어요|한 패턴이 반복되고 있어요|경향이 보여요|경우가 있었어요|흐름이 있었어요|패턴이 반복되고 있어요)$/, "");
  return `${trimmed}${ending}`;
}

export function fallbackNarrative1(moodLabel: string, n: number) {
  const expose = MOOD_MAP[moodLabel]?.expose || "비슷한 판단이 반복되는 경향이 보여요";
  return swapEnding(expose, endingFor(n));
}

export function fallbackNarrative2(moodLabel: string, n: number, reasonLabels: string[] = []) {
  const trigger = reasonLabels.filter(Boolean).slice(0, 2).join("·");
  const ending = endingFor(n);
  if (trigger) {
    return `${trigger} 보고 매매한 흐름이 여러 거래에서 ${ending}`;
  }
  return `같은 신호와 마음이 여러 거래에 걸쳐 ${ending}`;
}
