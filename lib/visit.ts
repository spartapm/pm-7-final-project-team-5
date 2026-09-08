const COOKIE = "pn_revisit";
const DAYS = 14;

export function hasRevisitCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => c.trim().startsWith(`${COOKIE}=`));
}

export function touchRevisitCookie() {
  if (typeof document === "undefined") return;
  const maxAge = DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE}=1;path=/;max-age=${maxAge};SameSite=Lax`;
}

export function clearRevisitCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=;path=/;max-age=0`;
}
