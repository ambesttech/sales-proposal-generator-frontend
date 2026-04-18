import { NextResponse } from "next/server";

import {
  DEMO_ACCOUNTS,
  MAX_AGE_SEC,
  SESSION_COOKIE,
  newSessionPayload,
  signSession,
} from "@/lib/auth/crypto";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { email?: unknown }).email !== "string" ||
    typeof (body as { password?: unknown }).password !== "string"
  ) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }
  const email = (body as { email: string }).email.trim().toLowerCase();
  const password = (body as { password: string }).password;

  const account = DEMO_ACCOUNTS[email];
  if (!account || account.password !== password) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await signSession(newSessionPayload(email, account.role));
  const res = NextResponse.json({
    ok: true,
    role: account.role,
    redirect: account.role === "admin" ? "/admin" : "/dashboard",
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return res;
}
