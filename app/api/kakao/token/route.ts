import { NextResponse } from "next/server";

function allowedRedirect(uri: string) {
  try {
    const u = new URL(uri);
    if (u.pathname !== "/auth/kakao/callback") return false;
    if (u.protocol === "http:" && u.hostname === "localhost" && u.port === "3005") return true;
    if (u.protocol === "https:" && u.hostname === "pattern-note.vercel.app") return true;
    const env = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;
    return Boolean(env && uri === env);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { code, redirectUri } = (await req.json()) as { code?: string; redirectUri?: string };
  const rest = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;
  const secret = process.env.KAKAO_CLIENT_SECRET;
  const redirect =
    (redirectUri && allowedRedirect(redirectUri) && redirectUri) ||
    process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
    "http://localhost:3005/auth/kakao/callback";

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
  const me = (await meRes.json()) as { id?: number };
  if (!me.id) {
    return NextResponse.json({ ok: false, error: "사용자 정보를 가져오지 못했어요" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    kakaoId: String(me.id),
  });
}
