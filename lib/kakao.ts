const REST_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;

export function hasKakaoKey() {
  return Boolean(REST_KEY);
}

export function kakaoRedirectUri() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/kakao/callback`;
  }
  return process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || "http://localhost:3005/auth/kakao/callback";
}

export function kakaoAuthorizeUrl(state: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: REST_KEY || "",
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export function startKakaoLogin() {
  if (!REST_KEY) return false;
  const state = Math.random().toString(36).slice(2);
  const redirectUri = kakaoRedirectUri();
  sessionStorage.setItem("kakao_oauth_state", state);
  sessionStorage.setItem("kakao_oauth_redirect", redirectUri);
  window.location.href = kakaoAuthorizeUrl(state, redirectUri);
  return true;
}
