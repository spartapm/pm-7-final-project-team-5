import { NextResponse } from "next/server";
import { BANNED_WORDS, endingFor, fallbackNarrative1, fallbackNarrative2, HIDDEN_TAGS, VAGUE_POINTERS } from "@/lib/insight-copy";
import { sideLabel } from "@/lib/format";
import type { Side } from "@/lib/types";

export const runtime = "nodejs";

const MODELS = [
  process.env.ANTHROPIC_MODEL,
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20250929",
  "claude-3-5-sonnet-20241022",
].filter(Boolean) as string[];

function clean(text: string) {
  return text.replace(/^["'“”]|["'“”]$/g, "").replace(/\s+/g, " ").trim();
}

function valid(text: string, ending: string, tags: string[]) {
  if (!text || text.length < 8 || text.length > 180) return false;
  if (!text.endsWith("요") && !text.endsWith(ending)) return false;
  const banned = [...BANNED_WORDS, ...HIDDEN_TAGS, ...tags];
  if (banned.some((w) => w && text.includes(w))) return false;
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

  const sys1 = `당신은 주식 매매 기록 앱의 '경향해석' 기능에서, 판단근거와 당시상태가 함께 반복된 패턴을 한 문장으로 서술하는 어시스턴트입니다(narrative1). 다음 규칙을 반드시 지키세요.
유저의 매매가 옳았는지 틀렸는지 절대 평가하지 않습니다. 어떤 경향이 반복되는지만 관찰자 시점으로 서술합니다.
"충동적으로", "성급하게", "실수로"처럼 평가가 담긴 부사·형용사는 쓰지 않습니다.
[내부 태그] 값은 어떤 형태로도, 부분적으로도 출력 문장에 노출하지 않습니다.
[판단근거 소분류 원문]이 여러 개 전달된 경우 개별 소분류를 나열하지 않고 하나의 트리거 상황절로 엮어 씁니다.
문장은 반드시 [필수 어미]로 끝나야 합니다.
결과는 한 문장만, 따옴표나 부연 설명 없이 문장 자체만 반환하세요.`;

  const user1 = `매매유형: ${sideLabel(side)}
내부 태그(비노출): ${moodMeta}
당시상태 매핑 문장: ${n1fb}
판단근거 소분류 원문: ${reasonLabels.join(" · ")}
필수 어미: ${ending}
참고 예시: 차트에서 지지선 근처라고 판단했을 때, 가격이 떨어진 상태에서 매수하는 경향이 보여요
위 정보를 바탕으로 narrative1 문장 하나를 작성하세요.`;

  let narrative1 = n1fb;
  for (const model of MODELS) {
    for (let i = 0; i < 2; i++) {
      try {
        const text = await once(key, model, sys1, user1);
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

  const sys2 = `당신은 주식 매매 기록 앱의 '경향해석' 기능에서, 사용자의 반복되는 매매 패턴을 짧게 관찰하는 문장 한 줄(narrative2)을 작성하는 어시스턴트입니다.
유저의 매매가 옳았는지 틀렸는지 절대 평가하지 않습니다.
"충동적으로", "성급하게", "실수로"처럼 평가가 담긴 부사·형용사는 쓰지 않습니다.
[내부 태그] 값은 노출하지 않습니다.
문장은 반드시 [필수 어미]로 끝나야 합니다.
narrative1 문장을 그대로 복사하지 마세요. 다만 트리거 상황(어떤 차트·뉴스·신호였는지, 어떤 심리·상황에서 매매로 이어졌는지)은 다른 어휘로 구체적으로 다시 언급하세요.
"이런 판단으로", "이렇게", "비슷한 판단으로", "그렇게", "이런 식으로" 같은 지시대명사·뭉뚱그린 표현은 쓰지 마세요.
narrative2는 narrative1과 다른 각도(반복 빈도, 여러 거래·구간에 걸친 지속성, 판단이 나타난 맥락)로 한 번 더 설명하세요.
결과는 한 문장만 반환하세요.
예시1: 지지선 근처에서 반등을 기다렸던 흐름이 한 번이 아니라 여러 하락 구간에서 반복되고 있어요
예시2: 뉴스 헤드라인만 보고 따라간 매수가 짧은 기간에 여러 번 이어지는 경향이 보여요
예시3: 주변이 사는 분위기와 겹친 매수가 같은 달 거래들에서도 다시 나타나는 패턴이 반복되고 있어요
예시4: 차트 패턴을 보고 이익을 일찍 확정한 매도가 한 거래에 그치지 않고 이어지는 경향이 보여요`;

  const user2 = `매매유형: ${sideLabel(side)}
내부 태그(비노출): ${moodMeta}
판단근거 소분류 원문: ${reasonLabels.join(" · ")}
판단근거 메타데이터: ${reasonMeta}
narrative1: ${narrative1}
필수 어미: ${ending}
위 정보를 바탕으로 narrative2 문장 하나를 작성하세요.`;

  let narrative2 = n2fb;
  for (const model of MODELS) {
    for (let i = 0; i < 2; i++) {
      try {
        const text = await once(key, model, sys2, user2);
        if (valid(text, ending, [moodMeta]) && !VAGUE_POINTERS.some((w) => text.includes(w))) {
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
