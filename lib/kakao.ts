const REST_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;
const REDIRECT = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || "http://localhost:3005/auth/kakao/callback";

export function hasKakaoKey() {
  return Boolean(REST_KEY);
}

export function kakaoAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: REST_KEY || "",
    redirect_uri: REDIRECT,
    response_type: "code",
    state,
    scope: "account_email",
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export function startKakaoLogin() {
  if (!REST_KEY) return false;
  const state = Math.random().toString(36).slice(2);
  sessionStorage.setItem("kakao_oauth_state", state);
  window.location.href = kakaoAuthorizeUrl(state);
  return true;
}
