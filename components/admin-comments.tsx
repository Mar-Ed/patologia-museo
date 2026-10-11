"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { statusLabels, type AdminComment, type CommentStatus } from "@/lib/comments/types";

type Action = "approve" | "reject" | "reopen" | "reply";
type Pathology = { slug: string; name: string };
function ModerationCard({ comment, title, disabled, onAction }: { comment: AdminComment; title: string; disabled: boolean; onAction: (comment: AdminComment, action: Action, extra?: { reason?: string; reply?: string }) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [reply, setReply] = useState(comment.admin_reply || "");
  const date = new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(comment.created_at));
  return <article className="moderation-card"><header><div><h2>{comment.author_name}</h2><time dateTime={comment.created_at}>{date}</time></div><span className={`comment-status status-${comment.status}`}>{comment.status === "pending" ? "Pendiente" : comment.status === "approved" ? "Aprobado" : "Rechazado"}</span></header>
    <Link className="comment-pathology" href={`/patologias/${comment.pathology_slug}`}>{title}</Link>
    {comment.parent_id && <div className="reply-context"><strong>Respuesta a {comment.parent_comment?.author_name || "un comentario"}</strong><p>{comment.parent_comment?.body}</p>{comment.parent_comment && comment.parent_comment.status !== "approved" && <p>El comentario original no está publicado. Apruébalo antes de publicar esta respuesta.</p>}</div>}
    <p className="comment-text">{comment.body}</p>
    {comment.email && <p className="private-note">Correo privado: <a href={`mailto:${comment.email}`}>{comment.email}</a></p>}
    {comment.rejection_reason && <p className="private-note">Motivo interno: {comment.rejection_reason}</p>}
    {comment.admin_reply && <div className="official-reply"><strong>Respuesta del museo{comment.status !== "approved" ? " (no publicada)" : ""}</strong><p className="comment-text">{comment.admin_reply}</p></div>}
    <div className="moderation-actions">
      {comment.status === "pending" ? <><button disabled={disabled} className="button-primary" onClick={() => void onAction(comment, "approve")}>Aprobar y publicar</button><details className="moderation-detail"><summary>Rechazar comentario</summary><form className="museum-form" onSubmit={event => { event.preventDefault(); void onAction(comment, "reject", { reason }); }}><label htmlFor={`reason-${comment.id}`}>Motivo interno (opcional)</label><textarea id={`reason-${comment.id}`} maxLength={500} rows={2} value={reason} onChange={event => setReason(event.target.value)} disabled={disabled} /><button disabled={disabled} className="button-secondary">Confirmar rechazo</button></form></details></> : <button disabled={disabled} className="button-secondary" onClick={() => void onAction(comment, "reopen")}>{comment.status === "approved" ? "Retirar a pendientes" : "Volver a pendientes"}</button>}
      {comment.status === "approved" && <details className="moderation-detail"><summary>{comment.admin_reply ? "Editar respuesta" : "Responder"}</summary><form className="museum-form" onSubmit={event => { event.preventDefault(); void onAction(comment, "reply", { reply }); }}><label htmlFor={`reply-${comment.id}`}>Respuesta oficial</label><textarea id={`reply-${comment.id}`} maxLength={2000} rows={4} value={reply} onChange={event => setReply(event.target.value)} disabled={disabled} /><small>Hasta 2000 caracteres. Deja el campo vacío para retirar la respuesta.</small><button disabled={disabled} className="button-primary">Guardar respuesta</button></form></details>}
    </div>
  </article>;
}

export function AdminComments({ email, pathologies }: { email: string; pathologies: Pathology[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<CommentStatus>("pending");
  const [slug, setSlug] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const locked = useRef(false);
  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const params = new URLSearchParams({ status, slug, search, page: String(page) });
      const response = await fetch(`/api/admin/comments?${params}`, { cache: "no-store", signal });
      if (response.status === 401) { router.replace("/admin/login"); router.refresh(); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (page > 0 && !data.comments.length) { setPage(0); return; }
      setComments(data.comments); setTotal(data.total);
    } catch (failure) { if (!signal.aborted) setError(failure instanceof Error ? failure.message : "No se pudieron cargar los comentarios."); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [status, slug, search, page, router]);
  // State changes inside load follow the awaited HTTP response, not the render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load, revision]);
  async function mutate(endpoint: string, body: unknown) {
    const response = await fetch(`/api/admin/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (response.status === 401) { router.replace("/admin/login"); router.refresh(); }
    if (!response.ok) throw new Error(data.error);
    return data;
  }
  async function act(comment: AdminComment, action: Action, extra = {}) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      await mutate("moderate", { id: comment.id, version: comment.version, action, ...extra });
      setMessage(action === "approve" ? "Comentario aprobado y publicado." : action === "reject" ? "Comentario rechazado. Permanece privado." : action === "reopen" ? "Comentario devuelto a pendientes." : "Respuesta guardada.");
      refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo guardar el cambio."); }
    finally { locked.current = false; setBusy(false); }
  }
  async function logout() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError("");
    try { await mutate("logout", {}); router.replace("/admin/login"); router.refresh(); }
    catch { setError("No se pudo cerrar la sesión. Vuelve a intentarlo."); }
    finally { locked.current = false; setBusy(false); }
  }
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSlug(String(data.get("slug") || "")); setSearch(String(data.get("search") || "").trim()); setPage(0); refresh();
  }
  function refresh() { setLoading(true); setError(""); setRevision(value => value + 1); }
  return <><header className="admin-heading"><div><p className="eyebrow">Administración del museo</p><h1>Comentarios</h1><p className="form-help">Revisa lo que comparte la comunidad y publica tus respuestas.</p></div><div className="admin-account"><span>{email}</span><Link href="/admin/restablecer">Cambiar contraseña</Link><button type="button" className="button-secondary" onClick={() => void logout()} disabled={busy}>Cerrar sesión</button></div></header>
    <div className="admin-status-filters" aria-label="Estado de los comentarios">{(Object.keys(statusLabels) as CommentStatus[]).map(value => <button key={value} type="button" aria-pressed={status === value} disabled={busy} onClick={() => { setStatus(value); setPage(0); setMessage(""); refresh(); }}>{statusLabels[value]}</button>)}</div>
    <form className="museum-form admin-search" onSubmit={filter}><div><label htmlFor="filter-pathology">Ficha</label><select id="filter-pathology" name="slug" disabled={busy} defaultValue=""><option value="">Todas las fichas</option>{pathologies.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div><div><label htmlFor="filter-search">Buscar en el comentario</label><input id="filter-search" name="search" type="search" maxLength={100} disabled={busy} placeholder="Escribe una palabra…" /></div><button className="button-primary" disabled={busy}>Filtrar</button><button type="button" className="button-secondary" disabled={busy || loading} onClick={refresh}>Actualizar</button></form>
    <div role="status" aria-live="polite">{message && <p className="form-success">{message}</p>}{loading && <p>Cargando comentarios…</p>}</div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <section aria-label={statusLabels[status]} aria-busy={loading}>
      {!loading && !error && <p className="admin-count">{total} {total === 1 ? "comentario" : "comentarios"} · {statusLabels[status].toLowerCase()}</p>}
      {!loading && !error && !comments.length && <div className="comment-empty"><h2>No hay comentarios en esta vista</h2><p>Los nuevos envíos aparecerán en Pendientes para que puedas revisarlos.</p></div>}
      {!loading && comments.map(comment => <ModerationCard key={`${comment.id}:${comment.version}`} comment={comment} title={pathologies.find(item => item.slug === comment.pathology_slug)?.name || comment.pathology_slug} disabled={busy || Boolean(error)} onAction={act} />)}
    </section>
    {total > 20 && <nav className="admin-pagination" aria-label="Páginas de comentarios"><button className="button-secondary" disabled={busy || loading || page === 0} onClick={() => { setPage(value => value - 1); refresh(); }}>Anterior</button><span>Página {page + 1} de {Math.ceil(total / 20)}</span><button className="button-secondary" disabled={busy || loading || (page + 1) * 20 >= total} onClick={() => { setPage(value => value + 1); refresh(); }}>Siguiente</button></nav>}
  </>;
}
