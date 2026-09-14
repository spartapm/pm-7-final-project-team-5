const KEY = "patternnote:registry";

export type RegistryAccount = {
  id: string;
  kakaoId?: string;
  email?: string;
  password?: string;
  nickname: string;
};

function load(): RegistryAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RegistryAccount[]) : [];
  } catch {
    return [];
  }
}

function save(rows: RegistryAccount[]) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

export function findByKakao(kakaoId: string) {
  return load().find((a) => a.kakaoId === kakaoId) ?? null;
}

export function findByEmail(email: string) {
  return load().find((a) => a.email?.toLowerCase() === email.trim().toLowerCase()) ?? null;
}

export function upsertRegistry(row: RegistryAccount) {
  const email = row.email?.trim().toLowerCase();
  const rows = load().filter((a) => {
    if (a.id === row.id) return false;
    if (row.kakaoId && a.kakaoId === row.kakaoId) return false;
    if (email && a.email?.toLowerCase() === email) return false;
    return true;
  });
  rows.push({ ...row, email: email || row.email });
  save(rows);
}

export function removeRegistry(opts: { id?: string; email?: string | null; kakaoId?: string | null }) {
  const email = opts.email?.trim().toLowerCase();
  save(
    load().filter((a) => {
      if (opts.id && a.id === opts.id) return false;
      if (email && a.email?.toLowerCase() === email) return false;
      if (opts.kakaoId && a.kakaoId === opts.kakaoId) return false;
      return true;
    })
  );
}

export function passwordValid(pw: string) {
  if (pw.length < 10 || /\s/.test(pw)) return false;
  const kinds = [/[A-Za-z]/, /\d/, /[^A-Za-z0-9\s]/].filter((r) => r.test(pw)).length;
  return kinds >= 2;
}

export function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
