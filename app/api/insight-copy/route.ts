import { NextResponse } from "next/server";
import { BANNED_WORDS, endingFor, fallbackNarrative1, fallbackNarrative2, HIDDEN_TAGS, NARRATIVE1_SHOTS, NARRATIVE2_SHOTS, VAGUE_POINTERS } from "@/lib/insight-copy";
import { sideLabel } from "@/lib/format";
import type { Side } from "@/lib/types";

export const runtime = "nodejs";

const MODELS = [
  process.env.ANTHROPIC_MODEL,
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20250929",
  "claude-3-5-sonnet-20241022",
].filter(Boolean) as string[];

const NUMBER_TALK = /\d+\s*건|\d+\s*%|N번|N건/;
const REPEAT_EOJEOL = /(\S{2,})\s+\1/;

function clean(text: string) {
  return text.replace(/^["'“”]|["'“”]$/g, "").replace(/\s+/g, " ").trim();
}

function valid(text: string, ending: string, tags: string[], opts?: { narrative2?: boolean }) {
  if (!text || text.length < 8 || text.length > 180) return false;
  if (!text.endsWith("요") && !text.endsWith(ending)) return false;
  if (text.includes("한 경향이 보여요") || text.includes("한 패턴이 반복되고 있어요")) return false;
  if (REPEAT_EOJEOL.test(text)) return false;
  const banned = [...BANNED_WORDS, ...HIDDEN_TAGS, ...tags];
  if (banned.some((w) => w && text.includes(w))) return false;
  if (opts?.narrative2) {
    if (NUMBER_TALK.test(text)) return false;
    if (VAGUE_POINTERS.some((w) => text.includes(w))) return false;
  }
  return true;
}

async function once(key: string, model: string, system: string, user: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 220,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) return "";
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  return clean(data.content?.find((c) => c.type === "text")?.text ?? "");
}

const SYS1 = `당신은 주식 매매 기록 앱의 '경향해석' 기능에서, 판단근거와 당시상태가 함께 반복된 패턴을 한 문장으로 서술하는 어시스턴트입니다(narrative1). 다음 규칙을 반드시 지키세요.
1. 유저의 매매가 옳았는지 틀렸는지 절대 평가하지 않습니다. 어떤 경향이 반복되는지만 관찰자 시점으로 서술합니다.
2. "충동적으로", "성급하게", "실수로"처럼 평가가 담긴 부사·형용사는 쓰지 않습니다.
3. [내부 태그] 값은 어떤 형태로도, 부분적으로도 출력 문장에 노출하지 않습니다 (예: 태그에 포함된 단어 일부만 그대로 쓰는 것도 금지). 맥락 참고용입니다.
4. [판단근거 소분류 원문]이 여러 개 전달된 경우(대분류 매치), 개별 소분류를 나열하지 않고 그 의미를 왜곡하지 않는 선에서 자연스럽게 하나의 트리거 상황절("~했을 때", "~하다가" 등)로 엮어 씁니다. 1개만 전달된 경우(소분류 매치)는 그 문구만으로 트리거 상황절을 만듭니다. [판단근거 메타데이터]는 각 원문이 어떤 범주인지 이해하는 맥락으로 참고합니다.
5. 그 상황절과 [당시상태 매핑 문장]을 하나의 자연스러운 문장으로 결합합니다.
6. 문장은 반드시 [필수 어미]로 끝나야 합니다. [당시상태 매핑 문장]에 이미 다른 어미가 포함되어 있어도 그 어미를 그대로 두지 않고, 문장의 핵심 의미는 보존한 채 끝맺음만 [필수 어미]에 맞춰 자연스럽게 바꿔서 결합합니다. 단, [필수 어미]는 그 의미로 자연스럽게 끝나야 한다는 뜻이지 글자를 무조건 그대로 이어붙이라는 뜻이 아닙니다 — 문장의 마지막 서술어가 이미 관형형 어미("-는", "-ㄴ/은", "-려는" 등)로 끝난 상태라면 그 위에 어미를 또 덧붙이지 말고 자연스럽게 교체하세요 (예: "동참하는" 뒤에 "한"을 겹쳐 "동참하는 한 경향이 보여요"처럼 관형어가 두 번 겹치는 문장은 금지합니다).
7. 결과는 한 문장만, 따옴표나 부연 설명 없이 문장 자체만 반환하세요.
8. 문장이 줄바꿈되어 표시될 때 한 단어가 두 줄로 쪼개지지 않도록, 한 줄 기준 20자 이내에서 어절(단어) 단위로 자연스럽게 끊어지도록 문장을 구성합니다.
9. 문장을 반환하기 전에, 같은 단어나 어절이 연속으로 반복되지 않았는지, 하나의 자연스러운 주어-서술어 구조로 문법이 완결되었는지 스스로 다시 확인한 뒤 최종 문장만 반환하세요.`;

const SYS2 = `당신은 주식 매매 기록 앱의 '경향해석' 기능에서, 사용자의 반복되는 매매 패턴을 짧게 관찰하는 문장 한 줄(narrative2)을 작성하는 어시스턴트입니다. 다음 규칙을 반드시 지키세요.
1. 유저의 매매가 옳았는지 틀렸는지 절대 평가하지 않습니다. 어떤 경향이 반복되는지만 관찰자 시점으로 서술합니다.
2. "충동적으로", "성급하게", "실수로"처럼 평가가 담긴 부사·형용사는 쓰지 않습니다.
3. [내부 태그] 값은 어떤 형태로도, 부분적으로도 출력 문장에 노출하지 않습니다 (예: 태그에 포함된 단어 일부만 그대로 쓰는 것도 금지). 맥락 참고용입니다.
4. 문장은 반드시 [필수 어미]로 끝나야 합니다. 단, [필수 어미]는 그 의미로 자연스럽게 끝나야 한다는 뜻이지 글자를 무조건 그대로 이어붙이라는 뜻이 아닙니다 — 문장의 마지막 서술어가 이미 관형형 어미("-는", "-ㄴ/은", "-려는" 등)로 끝난 상태라면 그 위에 어미를 또 덧붙이지 말고 자연스럽게 교체하세요 (예: "동참하는" 뒤에 "한"을 겹쳐 "동참하는 한 경향이 보여요"처럼 관형어가 두 번 겹치는 문장은 금지합니다).
5. [narrative1] 문장을 그대로 복사하지 마세요. 다만 [판단근거 소분류 원문]과 [당시상태 매핑 문장]이 가리키는 구체적인 트리거 상황(어떤 차트·뉴스·시장 신호였는지, 어떤 심리·상황에서 매매로 이어졌는지)은 narrative1과 다른 어휘로 다시 한번 구체적으로 언급해야 합니다.
6. "이런 판단으로", "이렇게", "이런 식으로", "비슷한 판단으로", "이런 감각적 판단으로"처럼 트리거 내용을 지시대명사나 뭉뚱그린 표현으로 대체하는 것은 금지합니다. 문장만 읽어도 어떤 신호·상황이었는지 파악할 수 있어야 합니다.
7. narrative2는 narrative1과 다른 각도(반복 빈도, 여러 거래·구간에 걸친 지속성, 그 판단이 나타난 맥락 등)로 한 번 더 풀어 설명합니다. 이때 (a) 트리거가 된 판단근거 상황과 (b) 당시상태(감정·판단) 두 가지가 반드시 모두 자연스럽게 포함되어야 하며, 둘 중 하나라도 빠지면 안 됩니다. 또한 반복성·빈도는 "여러 차례", "여러 거래에서", "반복적으로"와 같은 정성적 표현으로만 나타내고, 표본수·횟수·비율 등 구체적인 숫자는 어떤 형태로도 절대 언급하지 마세요(예: "3건", "N번", "50%" 금지) — 숫자는 카드의 다른 영역에 이미 표시되므로 문장에서 다시 말할 필요가 없습니다.
8. 결과는 한 문장만, 따옴표나 부연 설명 없이 문장 자체만 반환하세요.
9. 문장이 줄바꿈되어 표시될 때 한 단어가 두 줄로 쪼개지지 않도록, 한 줄 기준 20자 이내에서 어절(단어) 단위로 자연스럽게 끊어지도록 문장을 구성합니다.
10. 문장을 반환하기 전에, 같은 단어나 어절이 연속으로 반복되지 않았는지, 하나의 자연스러운 주어-서술어 구조로 문법이 완결되었는지 스스로 다시 확인한 뒤 최종 문장만 반환하세요.`;

export async function POST(req: Request) {
  const body = (await req.json()) as {
    side?: Side;
    moodLabel?: string;
    moodMeta?: string;
    reasonLabels?: string[];
    reasonMeta?: string;
    count?: number;
  };
  const side: Side = body.side === "sell" ? "sell" : "buy";
  const moodLabel = String(body.moodLabel || "");
  const moodMeta = String(body.moodMeta || "");
  const reasonLabels = Array.isArray(body.reasonLabels) ? body.reasonLabels.map(String) : [];
  const reasonMeta = String(body.reasonMeta || "");
  const count = Number(body.count) || 3;
  const ending = endingFor(count);
  const n1fb = fallbackNarrative1(moodLabel, count);
  const n2fb = fallbackNarrative2(moodLabel, count, reasonLabels);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ narrative1: n1fb, narrative2: n2fb });

  const user1 = `매매유형: ${sideLabel(side)}
내부 태그(비노출): ${moodMeta}
당시상태 매핑 문장: ${n1fb}
판단근거 소분류 원문: ${reasonLabels.join(" · ")}
판단근거 메타데이터: ${reasonMeta}
필수 어미: ${ending}
참고 예시:
${NARRATIVE1_SHOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}
위 정보를 바탕으로 narrative1 문장 하나를 작성하세요.`;

  let narrative1 = n1fb;
  for (const model of MODELS) {
    for (let i = 0; i < 2; i++) {
      try {
        const text = await once(key, model, SYS1, user1);
        if (valid(text, ending, [moodMeta])) {
          narrative1 = text;
          break;
        }
      } catch {
        continue;
      }
    }
    if (narrative1 !== n1fb) break;
  }

  const user2 = `매매유형: ${sideLabel(side)}
내부 태그(비노출): ${moodMeta}
참고 문장(문체 앵커): ${n1fb}
판단근거 소분류 원문: ${reasonLabels.join(" · ")}
판단근거 메타데이터: ${reasonMeta}
narrative1: ${narrative1}
필수 어미: ${ending}
참고 예시:
${NARRATIVE2_SHOTS.map((s, i) => `${i + 1}. ${s}`).join("\n")}
위 정보를 바탕으로, narrative1과 다른 표현으로 트리거 내용을 구체적으로 다시 언급하는 narrative2 문장 하나를 작성하세요.`;

  let narrative2 = n2fb;
  for (const model of MODELS) {
    for (let i = 0; i < 2; i++) {
      try {
        const text = await once(key, model, SYS2, user2);
        if (valid(text, ending, [moodMeta], { narrative2: true })) {
          narrative2 = text;
          break;
        }
      } catch {
        continue;
      }
    }
    if (narrative2 !== n2fb) break;
  }

  return NextResponse.json({ narrative1, narrative2, observation: narrative1, interpretation: narrative2 });
}
