import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/crypto";

/** Same-origin redirect; avoids malformed Location when proxy headers differ from request.url. */
function redirectPath(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
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
