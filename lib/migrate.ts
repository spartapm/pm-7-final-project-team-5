import { findMoodByMeta, findReasonByMeta } from "./categories";
import type { CategoryPick, Side, Trade } from "./types";

const REASON_MAP: Record<string, string | null> = {
  "주요 지수 급등락": "코스피/코스닥 지수 급등락",
  "금리·환율 변동": null,
  "업종/섹터 전반 이슈": "업종 전반 이슈(규제·트렌드)",
  "실적발표(서프라이즈/쇼크)": null,
  "자사주 소각·매입": "자사주 매입·소각",
  "락인(보호예수) 설정": null,
  "락인 해제": null,
  유상증자: "유상증자 발표",
  무상증자: "무상증자 발표",
  "배당 공시": null,
  "인수합병·지분변동": null,
  "신규상장(IPO)": "신규 상장·상장폐지 이슈",
  "정책·규제 뉴스": "정책·정부 발표(세제·지원정책)",
  "산업 트렌드·테마 뉴스": "업종 전반 이슈(규제·트렌드)",
  "기업 리스크·스캔들 뉴스": null,
  "차트 패턴(지지·저항, 돌파)": "지지·저항 돌파",
  "거래량 급증·급감": "거래량 급증·급감",
  "이동평균선 신호": "추세 신호",
  "지인 추천": "지인 추천",
  "커뮤니티·SNS 정보": "커뮤니티(카페·오픈채팅 등) 정보",
  "전문가 리포트·애널리스트 의견": "전문가·애널리스트 리포트",
};

const MOOD_MAP: Record<string, Record<string, string | null>> = {
  buy: {
    중립: "계획대로 진행(담담함)",
    "저가 착각, 물타기": null,
    "추세 과잉확신": "확신에 찬 기대감",
    "급등 추격, 조급함": "놓칠까봐 조급함(FOMO)",
    "손실 만회 매매": "손실 만회 조급함(보복 매매)",
    "군집 행동": null,
    무지성: "특별한 계기 없이 진행",
  },
  sell: {
    중립: "계획대로 진행(담담함)",
    "공포 매도": "패닉 매도(공포)",
    "수익 조기 실현": "조급한 매도(더 오를까봐)",
    "원금 회복 심리": null,
    "손절 지연 후 항복": "지쳐서 포기(무기력)",
    무지성: "특별한 계기 없이 진행",
    "(집계 제외)": null,
  },
};

function migrateReason(pick: CategoryPick): CategoryPick {
  const key = pick.meta || pick.label;
  if (!(key in REASON_MAP)) {
    const already = findReasonByMeta(key) || findReasonByMeta(pick.label);
    if (already) {
      return { group: already.group, label: already.label, meta: already.meta, subtitle: already.subtitle };
    }
    return pick;
  }
  const target = REASON_MAP[key];
  if (!target) return pick;
  const row = findReasonByMeta(target);
  if (!row) return pick;
  return { group: row.group, label: row.label, meta: row.meta, subtitle: row.subtitle };
}

function migrateMood(pick: CategoryPick, side: Side): CategoryPick {
  const key = pick.meta || pick.label;
  const table = MOOD_MAP[side];
  if (table && key in table) {
    const target = table[key];
    if (!target) return pick;
    const row = findMoodByMeta(target);
    if (!row) return pick;
    return { group: row.group, label: row.label, meta: row.meta, subtitle: row.subtitle };
  }
  const already = findMoodByMeta(key) || findMoodByMeta(pick.label);
  if (already) {
    return { group: already.group, label: already.label, meta: already.meta, subtitle: already.subtitle };
  }
  return pick;
}

function uniquePicks(picks: CategoryPick[]) {
  const seen = new Set<string>();
  const next: CategoryPick[] = [];
  for (const pick of picks) {
    const id = pick.meta || pick.label;
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(pick);
  }
  return next;
}

export function migrateTradeReasons(trade: Trade): Trade {
  return {
    ...trade,
    reasons: uniquePicks(trade.reasons.map(migrateReason)),
    moods: uniquePicks(trade.moods.map((m) => migrateMood(m, trade.side))),
  };
}
