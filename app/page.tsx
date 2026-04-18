import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/crypto";

export default async function Home() {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) {
    redirect("/login");
  }
  redirect(session.role === "admin" ? "/admin" : "/dashboard");
}
