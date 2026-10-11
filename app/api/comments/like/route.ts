import type { NextRequest } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { checkOrigin, failure, field, fingerprint, json, networkId, readBody, RequestError, validUuid, visitorId } from "@/lib/comments/security";

export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    const body = await readBody(request);
    const id = field(body, "id", 36, 36);
    if (!validUuid(id) || typeof body.liked !== "boolean") throw new RequestError(400, "La reacción no es válida.");
    const visitor = visitorId(request);
    if (!visitor) throw new RequestError(400, "Recarga los comentarios y permite las cookies para reaccionar.");
    const { data, error } = await serviceClient().rpc("set_museum_comment_like", { p_id: id, p_liked: body.liked, p_visitor_hash: fingerprint("visitor", visitor), p_network_hash: networkId(request) });
    if (error?.message === "RATE_LIMITED") throw new RequestError(429, "Has realizado varias acciones seguidas. Espera unos minutos.");
    if (error?.message === "NOT_PUBLISHED") throw new RequestError(404, "El comentario ya no está publicado. Actualiza la conversación.");
    if (error) throw error;
    return json({ liked: data.liked === true, like_count: Number(data.like_count) });
  } catch (error) { return failure(error); }
}
