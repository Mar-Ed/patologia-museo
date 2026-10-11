import { type NextRequest } from "next/server";
import { adminSession, serviceClient, sessionClient } from "@/lib/supabase/server";
import { appOrigin, checkOrigin, failure, field, fingerprint, json, networkId, readBody, RequestError, validEmail, validUuid } from "@/lib/comments/security";
import { getPathologyIndex } from "@/lib/pathology-index";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ action: string }> };
async function requireAdmin() {
  const session = await adminSession();
  if (!session) throw new RequestError(401, "Tu sesión no está disponible. Vuelve a iniciar sesión.");
  return session;
}
async function authLimit(kind: string, email: string, request: Request) {
  const { data, error } = await serviceClient().rpc("consume_museum_auth_limit", {
    p_kind: kind, p_network_hash: networkId(request), p_account_hash: fingerprint("account", email),
  });
  if (error) throw error;
  if (data !== true) throw new RequestError(429, "Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.");
}
export async function GET(request: NextRequest, context: Context) {
  try {
    if ((await context.params).action !== "comments") throw new RequestError(404, "Ruta no disponible.");
    const { client } = await requireAdmin();
    const params = request.nextUrl.searchParams;
    const status = params.get("status") || "pending";
    const page = Number(params.get("page") || 0);
    const slug = params.get("slug") || "";
    const search = (params.get("search") || "").trim();
    if (!["pending", "approved", "rejected"].includes(status) || !Number.isSafeInteger(page) || page < 0 || page > 10000 || search.length > 100) throw new RequestError(400, "Los filtros no son válidos.");
    if (slug && !getPathologyIndex().some(item => item.slug === slug)) throw new RequestError(400, "La ficha no es válida.");
    let query = client.from("museum_comments").select("*", { count: "exact" }).eq("status", status);
    if (slug) query = query.eq("pathology_slug", slug);
    if (search) query = query.ilike("body", `%${search.replace(/[\\%_]/g, "\\$&")}%`);
    const { data, error, count } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range(page * 20, page * 20 + 19);
    if (error) throw error;
    const parentIds = [...new Set((data || []).map(row => row.parent_id as string | null).filter((id): id is string => Boolean(id)))];
    const parents = parentIds.length ? await client.from("museum_comments").select("id,author_name,body,status").in("id", parentIds) : { data: [], error: null };
    if (parents.error) throw parents.error;
    return json({ comments: (data || []).map(row => ({ ...row, parent_comment: parents.data?.find(parent => parent.id === row.parent_id) || null })), total: count || 0 });
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    checkOrigin(request);
    const { action } = await context.params;
    const data = await readBody(request);
    if (action === "login" || action === "recovery") {
      const email = field(data, "email", 3, 254).toLowerCase();
      if (!validEmail(email)) throw new RequestError(400, "Escribe un correo electrónico válido.");
      const password = action === "login" ? field(data, "password", 1, 1024, false) : "";
      await authLimit(action, email, request);
      const client = await sessionClient();
      if (action === "recovery") {
        // Always respond identically to avoid disclosing which account exists.
        await client.auth.resetPasswordForEmail(email, { redirectTo: `${appOrigin(request)}/auth/callback` });
        return json({ message: "Si el correo corresponde a una cuenta, recibirás un enlace para restablecer la contraseña. Revisa también la carpeta de spam." });
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      const { data: allowed, error: permissionError } = error ? { data: false, error: null } : await client.rpc("is_museum_admin");
      if (error || permissionError || allowed !== true) {
        await client.auth.signOut({ scope: "local" });
        throw new RequestError(401, "No se pudo iniciar sesión con esos datos.");
      }
      return json({ redirect: "/admin" });
    }
    if (action === "logout") {
      const { error } = await (await sessionClient()).auth.signOut({ scope: "global" });
      if (error) throw error;
      return json({ redirect: "/admin/login" });
    }
    const { client } = await requireAdmin();
    if (action === "password") {
      const password = field(data, "password", 12, 128, false);
      if (password !== field(data, "confirm", 12, 128, false)) throw new RequestError(400, "Las contraseñas no coinciden.");
      const { error } = await client.auth.updateUser({ password });
      if (error) throw new RequestError(400, "No se pudo cambiar la contraseña. Usa una contraseña nueva de al menos 12 caracteres o solicita otro enlace.");
      const { error: logoutError } = await client.auth.signOut({ scope: "global" });
      if (logoutError) throw logoutError;
      return json({ redirect: "/admin/login?changed=1" });
    }
    if (action !== "moderate") throw new RequestError(404, "Ruta no disponible.");
    const id = field(data, "id", 36, 36);
    const operation = field(data, "action", 1, 10);
    if (!validUuid(id) || !["approve", "reject", "reopen", "reply"].includes(operation) || !Number.isSafeInteger(data.version) || Number(data.version) < 1) throw new RequestError(400, "La acción no es válida.");
    const { error } = await client.rpc("moderate_museum_comment", { p_id: id, p_action: operation, p_version: data.version,
      p_reply: operation === "reply" ? field(data, "reply", 0, 2000) : null,
      p_reason: operation === "reject" ? field(data, "reason", 0, 500) : null });
    if (error?.code === "40001") throw new RequestError(409, "Este comentario cambió en otra pestaña. Actualiza la lista antes de continuar.");
    if (error?.code === "22023" || error?.code === "P0002") throw new RequestError(409, "El comentario ya no admite esa acción. Actualiza la lista.");
    if (error) throw error;
    return json({ message: "Comentario actualizado." });
  } catch (error) { return failure(error); }
}
