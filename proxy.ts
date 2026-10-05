import { NextResponse, type NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site-config";

// Source reports are editorial inputs, not downloadable website resources.
export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? request.nextUrl.hostname).split(":")[0].toLowerCase();
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? request.nextUrl.protocol.replace(":", "");
  if (["museopatologiaveterinaria.com", "museo-patologia.vercel.app"].includes(hostname) || (hostname === "www.museopatologiaveterinaria.com" && protocol === "http")) {
    return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, SITE_URL), 308);
  }
  if (/^\/(documentos_patologia_actualizados|nuevos_word)(\/|$)/i.test(request.nextUrl.pathname)) {
    return new NextResponse("Recurso no disponible", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  if (request.nextUrl.pathname === "/catalogo" && request.nextUrl.searchParams.has("categoria")) {
    const category = request.nextUrl.searchParams.get("categoria") ?? "";
    const target = request.nextUrl.clone();
    target.pathname = ["desarrollo", "musculoesqueletica", "reproductiva", "adquirida"].includes(category) ? `/catalogo/${category}` : "/catalogo";
    target.search = "";
    return NextResponse.redirect(target, 308);
  }
  if (/\.md$/i.test(request.nextUrl.pathname)) {
    return new NextResponse("Recurso no disponible", { status: 404, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
  }
  const response = NextResponse.next();
  if (hostname.endsWith(".vercel.app")) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image).*)"] };
