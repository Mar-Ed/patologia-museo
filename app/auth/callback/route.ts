import { NextResponse, type NextRequest } from "next/server";
import { adminSession, sessionClient } from "@/lib/supabase/server";
import { appOrigin } from "@/lib/comments/security";

export async function GET(request: NextRequest) {
  const target = new URL("/admin/recuperar?invalid=1", appOrigin(request));
  const code = request.nextUrl.searchParams.get("code");
  try {
    if (code && code.length < 2048) {
      const client = await sessionClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error && await adminSession()) { target.pathname = "/admin/restablecer"; target.search = ""; }
      else await client.auth.signOut({ scope: "local" });
    }
  } catch { /* Expired, reused or invalid recovery links never open the panel. */ }
  return NextResponse.redirect(target, { status: 303, headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
}
