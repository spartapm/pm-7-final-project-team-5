const KEY = "pn_next";
const SKIP = ["/", "/onboarding", "/login", "/signup", "/legal", "/auth", "/welcome"];

function allowed(path: string) {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return false;
  return !SKIP.some((p) => path === p || path.startsWith(p + "/"));
}

export function rememberNext(path: string) {
  if (typeof window === "undefined") return;
  const clean = path.split("#")[0] || "";
  if (!allowed(clean)) return;
  sessionStorage.setItem(KEY, clean);
}

export function takeNext(fallback = "/home") {
  if (typeof window === "undefined") return fallback;
  const raw = sessionStorage.getItem(KEY) || "";
  sessionStorage.removeItem(KEY);
  return allowed(raw) ? raw : fallback;
}
