export type Role = "user" | "admin";

export type SessionPayload = {
  email: string;
  role: Role;
  exp: number;
};

export const SESSION_COOKIE = "spg_session";

const MAX_AGE_SEC = 60 * 60 * 24 * 7;

/** Demo accounts — replace with real auth for production. */
export const DEMO_ACCOUNTS: Record<
  string,
  { password: string; role: Role }
> = {
  "user@user.com": { password: "user", role: "user" },
  "admin@admin.com": { password: "admin", role: "admin" },
};

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  return "dev-only-auth-secret-change-me";
}

const enc = new TextEncoder();

function utf8ToBinaryString(str: string): string {
  const bytes = enc.encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return bin;
}

function binaryStringToUtf8(bin: string): string {
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function toBase64UrlFromUtf8(utf8: string): string {
  return btoa(utf8ToBinaryString(utf8))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64UrlToUtf8(b64url: string): string {
  const pad = (4 - (b64url.length % 4)) % 4;
  const s = b64url.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(s);
  return binaryStringToUtf8(bin);
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bytesToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const secret = getSecret();
  const body = toBase64UrlFromUtf8(JSON.stringify(payload));
  const key = await importKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return `${body}.${bytesToHex(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;
  const lastDot = token.lastIndexOf(".");
  const body = token.slice(0, lastDot);
  const sigHex = token.slice(lastDot + 1);
  if (!body || !/^[A-Za-z0-9_-]+$/.test(body)) return null;

  const secret = getSecret();
  const key = await importKey(secret);
  const expected = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expectedHex = bytesToHex(expected);
  if (!timingSafeEqualHex(expectedHex, sigHex)) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(fromBase64UrlToUtf8(body));
  } catch {
    return null;
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as { email?: unknown }).email !== "string" ||
    ((parsed as { role?: unknown }).role !== "user" &&
      (parsed as { role?: unknown }).role !== "admin") ||
    typeof (parsed as { exp?: unknown }).exp !== "number"
  ) {
    return null;
  }
  const p = parsed as SessionPayload;
  if (p.exp < Math.floor(Date.now() / 1000)) return null;
  return p;
}

export function newSessionPayload(email: string, role: Role): SessionPayload {
  return {
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SEC,
  };
}

export { MAX_AGE_SEC };
