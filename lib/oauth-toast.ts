export function stashOAuthToast(message: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("oauth_toast", message);
}

export function peekOAuthToast() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("oauth_toast");
}

export function consumeOAuthToast() {
  if (typeof window === "undefined") return null;
  const message = sessionStorage.getItem("oauth_toast");
  if (message) sessionStorage.removeItem("oauth_toast");
  return message;
}
