"use client";
import { useCallback, useEffect, useState } from "react";
import type { PublicComment } from "@/lib/comments/types";
import { CommentForm } from "@/components/comment-form";
import { CommentThread } from "@/components/comment-thread";

export function PathologyComments({ slug }: { slug: string }) {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [ready, setReady] = useState(false);
  const [features, setFeatures] = useState(false);
  const load = useCallback(async (after?: PublicComment, signal?: AbortSignal) => {
    try {
      const params = new URLSearchParams({ slug });
      if (after) { params.set("beforeAt", after.published_at); params.set("beforeId", after.id); }
      const response = await fetch(`/api/comments?${params}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setComments(current => after ? [...current, ...data.comments.filter((item: PublicComment) => !current.some(row => row.id === item.id))] : data.comments);
      setHasMore(data.hasMore); setReady(true); setFeatures(data.featuresAvailable === true);
    } catch (failure) {
      if (!signal?.aborted) setLoadError(failure instanceof Error ? failure.message : "No se pudieron cargar los comentarios.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [slug]);
  function reload(after?: PublicComment) { setLoading(true); setLoadError(""); void load(after); }
  // State changes follow the awaited HTTP response, not the render.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const controller = new AbortController(); void load(undefined, controller.signal); return () => controller.abort(); }, [load]);
  return <section className="museum-comments" aria-labelledby="comments-title"><div className="site-shell blog-comments-shell">
    <header className="blog-comments-heading"><p className="eyebrow">Conversación y aprendizaje</p><h2 id="comments-title">Comentarios</h2><p className="form-help">Comparte una pregunta, responde a otros lectores o deja un Me gusta. No necesitas una cuenta.</p></header>
    <div className="comment-form-card"><h3>Únete a la conversación</h3><p className="form-help">Revisamos los comentarios y las respuestas antes de publicarlos.</p><CommentForm slug={slug} ready={ready} /></div>
    <div className="comment-list-heading"><h3>La conversación</h3><button className="comment-refresh" type="button" disabled={loading} onClick={() => reload()}>Actualizar</button></div>
    <div aria-busy={loading} className="comment-list blog-comment-list">
      {comments.map(comment => <CommentThread key={`${comment.id}:${comment.like_count}:${comment.liked}`} comment={comment} slug={slug} enabled={features} />)}
      {!loading && !loadError && !comments.length && <p className="comment-empty">Todavía no hay comentarios publicados. Sé el primero en compartir una pregunta u observación.</p>}
      {loading && <p role="status">Cargando comentarios…</p>}
      {loadError && <div role="alert"><p className="form-error">No se pudieron cargar los comentarios. La ficha sigue disponible.</p><button type="button" className="button-secondary" onClick={() => reload()}>Reintentar</button></div>}
      {hasMore && !loadError && <button type="button" className="button-secondary" disabled={loading} onClick={() => reload(comments.at(-1))}>Cargar más comentarios</button>}
    </div><noscript>Activa JavaScript para consultar y enviar comentarios.</noscript>
  </div></section>;
}
