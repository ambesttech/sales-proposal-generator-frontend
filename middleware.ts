import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/crypto";

/** Origin the browser used (not nextUrl), so Location is always absolute — never "host:port" which browsers resolve as a relative path and stack. */
function getPublicOrigin(request: NextRequest): string {
  const host = request.headers.get("host");
  if (!host) {
    return request.nextUrl.origin;
  }
  const forwarded = request.headers.get("x-forwarded-proto");
  const proto =
    forwarded?.split(",")[0]?.trim() ||
    request.nextUrl.protocol.replace(":", "") ||
    "http";
  return `${proto}://${host}`;
}

function redirectPath(request: NextRequest, pathname: string) {
  const url = new URL(pathname, `${getPublicOrigin(request)}/`);
  url.search = "";
  return NextResponse.redirect(url);
}

/** True when path was poisoned by a bad relative redirect (e.g. Location: 38.x:3100). */
function pathStartsWithIpPortSegment(pathname: string): boolean {
  return /^\/(?:\d{1,3}\.){3}\d{1,3}:\d+(?:\/|$)/.test(pathname);
}

function isUserAppPath(pathname: string): boolean {
  if (pathname === "/dashboard") return true;
  if (pathname.startsWith("/dashboard/")) return true;
  if (pathname === "/proposals") return true;
  if (pathname.startsWith("/proposals/")) return true;
  if (pathname === "/create-proposal") return true;
  if (pathname.startsWith("/create-proposal/")) return true;
  return false;
}

function isAdminAppPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (pathStartsWithIpPortSegment(pathname)) {
    const dest = !session
      ? "/login"
      : session.role === "admin"
        ? "/admin"
        : "/dashboard";
    return redirectPath(request, dest);
  }

  if (pathname === "/login") {
    if (session) {
      const dest = session.role === "admin" ? "/admin" : "/dashboard";
      return redirectPath(request, dest);
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (!session) {
      return redirectPath(request, "/login");
    }
    const dest = session.role === "admin" ? "/admin" : "/dashboard";
    return redirectPath(request, dest);
  }

  if (isUserAppPath(pathname)) {
    if (!session) {
      return redirectPath(request, "/login");
    }
    if (session.role === "admin") {
      return redirectPath(request, "/admin");
    }
    return NextResponse.next();
  }

  if (isAdminAppPath(pathname)) {
    if (!session) {
      return redirectPath(request, "/login");
    }
    if (session.role !== "admin") {
      return redirectPath(request, "/dashboard");
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/proposals",
    "/proposals/:path*",
    "/create-proposal",
    "/create-proposal/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
