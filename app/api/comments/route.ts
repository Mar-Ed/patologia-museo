import { type NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { getPathologyIndex } from "@/lib/pathology-index";
import { publicClient, serviceClient } from "@/lib/supabase/server";
import { checkOrigin, failure, field, fingerprint, issueVisitor, json, networkId, readBody, RequestError, validEmail, validUuid, visitorId } from "@/lib/comments/security";
import type { PublicComment } from "@/lib/comments/types";

export const dynamic = "force-dynamic";
function checkSlug(slug: string) {
  if (!getPathologyIndex().some(item => item.slug === slug)) throw new RequestError(404, "No se encontró la ficha.");
}
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug") || "";
    checkSlug(slug);
    const parentId = request.nextUrl.searchParams.get("parentId");
    if (parentId !== null && !validUuid(parentId)) throw new RequestError(400, "El comentario original no es válido.");
    const beforeAt = request.nextUrl.searchParams.get("beforeAt");
    const beforeId = request.nextUrl.searchParams.get("beforeId");
    if ((beforeAt === null) !== (beforeId === null) || (beforeId && !validUuid(beforeId)) || (beforeAt && (!/^\d{4}-\d{2}-\d{2}T/.test(beforeAt) || !Number.isFinite(Date.parse(beforeAt))))) throw new RequestError(400, "La página solicitada no es válida.");
    const existingVisitor = visitorId(request);
    const visitor = existingVisitor || randomUUID();
    const params = { p_slug: slug, p_limit: 11, p_before_at: beforeAt, p_before_id: beforeId };
    let { data, error } = await serviceClient().rpc("list_museum_comments_v2", { ...params, p_parent_id: parentId, p_visitor_hash: fingerprint("visitor", visitor) });
    const featuresAvailable = error?.code !== "PGRST202";
    if (!featuresAvailable && !parentId) ({ data, error } = await publicClient().rpc("list_museum_comments", params));
    if (error) throw error;
    const rows = (data || []).map((row: PublicComment) => ({ ...row, parent_id: row.parent_id || null, liked: row.liked === true, like_count: Number(row.like_count || 0), reply_count: Number(row.reply_count || 0) })) as PublicComment[];
    const response = json({ comments: rows.slice(0, 10), hasMore: rows.length > 10, featuresAvailable });
    if (!existingVisitor) issueVisitor(response, visitor);
    return response;
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const data = await readBody(request);
    const slug = field(data, "slug", 1, 250);
    checkSlug(slug);
    const parentId = data.parentId ?? null;
    if (parentId !== null && (typeof parentId !== "string" || !validUuid(parentId))) throw new RequestError(400, "El comentario original no es válido.");
    const name = field(data, "name", 2, 60);
    const body = field(data, "body", 10, 2000);
    const email = field(data, "email", 0, 254).toLowerCase();
    if (email && !validEmail(email)) throw new RequestError(400, "Revisa el correo electrónico.");
    const requestId = field(data, "requestId", 36, 36);
    if (!validUuid(requestId) || data.consent !== true || (data.website !== undefined && data.website !== "")) throw new RequestError(400, "Revisa el formulario y acepta la publicación de tu comentario.");
    const visitor = visitorId(request);
    if (!visitor) throw new RequestError(400, "Recarga los comentarios y permite las cookies para enviar el formulario.");
    const params = {
      p_request_id: requestId, p_visitor_hash: fingerprint("visitor", visitor), p_network_hash: networkId(request),
      p_slug: slug, p_name: name, p_body: body, p_email: email || null,
    };
    let { error } = await serviceClient().rpc("submit_museum_comment_v2", { ...params, p_parent_id: parentId });
    if (error?.code === "PGRST202" && parentId === null) ({ error } = await serviceClient().rpc("submit_museum_comment", params));
    if (error?.message === "PARENT_NOT_PUBLISHED" || error?.message === "INVALID_PARENT") throw new RequestError(409, "El comentario original ya no está disponible. Actualiza la conversación.");
    if (error?.message === "RATE_LIMITED") throw new RequestError(429, "Has enviado varios comentarios. Espera unos minutos antes de volver a intentarlo.");
    if (error?.message === "REQUEST_CONFLICT") throw new RequestError(409, "Este envío ya fue procesado con otro contenido. Recarga la página para empezar uno nuevo.");
    if (error) throw error;
    return json({ message: parentId ? "Tu respuesta fue enviada para revisión. Aparecerá aquí cuando sea aprobada." : "Tu comentario fue enviado para revisión. Se publicará cuando sea aprobado." }, 201);
  } catch (error) { return failure(error); }
}
