export async function hashPassword(email: string, password: string) {
  const payload = `${email.trim().toLowerCase()}:${password}`;
  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
