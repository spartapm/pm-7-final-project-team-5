import { NextResponse } from "next/server";

async function unlinkWithToken(accessToken: string) {
  const res = await fetch("https://kapi.kakao.com/v1/user/unlink", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.ok;
}

async function refreshAccess(refreshToken: string) {
  const rest = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;
  const secret = process.env.KAKAO_CLIENT_SECRET;
  if (!rest || !refreshToken) return "";
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: rest,
    refresh_token: refreshToken,
  });
  if (secret) body.set("client_secret", secret);
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  const data = (await res.json()) as { access_token?: string };
  return data.access_token || "";
}

async function unlinkWithAdmin(kakaoId: string) {
  const admin = process.env.KAKAO_ADMIN_KEY;
  if (!admin || !kakaoId) return false;
  const res = await fetch("https://kapi.kakao.com/v1/user/unlink", {
    method: "POST",
    headers: {
      Authorization: `KakaoAK ${admin}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({ target_id_type: "user_id", target_id: kakaoId }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  const { kakaoId, accessToken, refreshToken } = (await req.json()) as {
    kakaoId?: string;
    accessToken?: string;
    refreshToken?: string;
  };
  if (accessToken && (await unlinkWithToken(accessToken))) {
    return NextResponse.json({ ok: true });
  }
  if (refreshToken) {
    const next = await refreshAccess(refreshToken);
    if (next && (await unlinkWithToken(next))) return NextResponse.json({ ok: true });
  }
  if (kakaoId && (await unlinkWithAdmin(kakaoId))) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false }, { status: 400 });
}
