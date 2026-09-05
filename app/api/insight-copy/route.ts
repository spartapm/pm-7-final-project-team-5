import { NextResponse } from "next/server";
import { sideLabel } from "@/lib/format";
import type { Side } from "@/lib/types";

export const runtime = "nodejs";

const MODELS = [
  process.env.ANTHROPIC_MODEL,
  "claude-sonnet-4-5",
  "claude-sonnet-4-5-20250929",
  "claude-3-5-sonnet-20241022",
].filter(Boolean) as string[];

const BLOCK =
  /(하세요|하셔야|해야 합|해야 해|목표가|비중|추천|매수하세요|매도하세요|1위|상위|하위|뇌동|앞으로|예정|전망합니다)/;

function template(side: Side, reason: string, mood: string, count: number) {
  const label = sideLabel(side);
  return {
    observation: `${label}할 때 ‘${reason}’와 ‘${mood}’가 ${count}번 겹쳤어요.`,
    interpretation:
      count >= 3
        ? `같은 판단 근거와 당시 상태가 ${count}건에서 반복되고 있어요.`
        : `같은 조합이 ${3 - count}건 더 쌓이면 반복 패턴으로 보여 드릴게요.`,
  };
}

function clean(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function allowed(text: string) {
  if (!text || text.length < 8 || text.length > 180) return false;
  if (BLOCK.test(text)) return false;
  return true;
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    side?: Side;
    reason?: string;
    mood?: string;
    count?: number;
  };
  const side: Side = body.side === "sell" ? "sell" : "buy";
  const reason = String(body.reason || "").slice(0, 40);
  const mood = String(body.mood || "").slice(0, 40);
  const count = Number(body.count) || 0;
  const fallback = template(side, reason || "판단 근거", mood || "당시 상태", count);

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json(fallback);

  const prompt = `당신은 주식 매매 일지의 관찰 문장을 씁니다. 종목 이름은 절대 쓰지 마세요.
매매 구분: ${sideLabel(side)}
판단 근거 그룹: ${reason}
당시 상태: ${mood}
반복 건수: ${count}

JSON만 반환하세요. 키는 observation, interpretation.
규칙:
- 주어는 이용자의 판단 습관이다. 종목이 주어가 되면 안 된다.
- 과거·현재 관찰만. 미래 시제 조언, 명령형(~하세요), 목표가/비중 수치, 순위 비교 금지.
- 뇌동매매 같은 평가 라벨 금지.
- observation은 사실(몇 번 겹쳤는지). interpretation은 반복 맥락을 되돌아보게 하는 한 문장.
- 각 문장 80자 이내, 한국어.`;

  for (const model of MODELS) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = data.content?.find((c) => c.type === "text")?.text ?? "";
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart < 0 || jsonEnd < 0) continue;
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
        observation?: string;
        interpretation?: string;
      };
      const observation = clean(String(parsed.observation || ""));
      const interpretation = clean(String(parsed.interpretation || ""));
      if (allowed(observation) && allowed(interpretation)) {
        return NextResponse.json({ observation, interpretation, source: "claude" });
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json(fallback);
}
