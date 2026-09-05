import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code } = (await req.json()) as { code?: string };
  const rest = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;
  const secret = process.env.KAKAO_CLIENT_SECRET;
  const redirect = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || "http://localhost:3005/auth/kakao/callback";
  if (!code || !rest) {
    return NextResponse.json({ ok: false, error: "설정이 부족해요" }, { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: rest,
    redirect_uri: redirect,
    code,
  });
  if (secret) body.set("client_secret", secret);

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  const token = (await tokenRes.json()) as { access_token?: string; error_description?: string };
  if (!token.access_token) {
    return NextResponse.json({ ok: false, error: token.error_description || "토큰 발급 실패" }, { status: 400 });
  }

  const meRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const me = (await meRes.json()) as {
    id?: number;
    kakao_account?: { email?: string; profile?: { nickname?: string } };
  };
  if (!me.id) {
    return NextResponse.json({ ok: false, error: "사용자 정보를 가져오지 못했어요" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    kakaoId: String(me.id),
    nickname: me.kakao_account?.profile?.nickname || "회원",
  });
}
