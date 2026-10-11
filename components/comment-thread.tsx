"use client";
import { useRef, useState } from "react";
import { ThumbsUp, MessageCircle, ChevronDown } from "lucide-react";
import type { PublicComment } from "@/lib/comments/types";
import { CommentForm } from "@/components/comment-form";

const date = (value: string) => new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeZone: "America/Lima" }).format(new Date(value));
export function CommentThread({ comment, slug, enabled, isReply = false }: { comment: PublicComment; slug: string; enabled: boolean; isReply?: boolean }) {
  const [liked, setLiked] = useState(comment.liked);
  const [count, setCount] = useState(comment.like_count);
  const [liking, setLiking] = useState(false);
  const [error, setError] = useState("");
  const [replying, setReplying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<PublicComment[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const likeLock = useRef(false);
  const replyLock = useRef(false);
  const replyButton = useRef<HTMLButtonElement>(null);
  async function like() {
    if (likeLock.current || !enabled) return;
    likeLock.current = true; setLiking(true); setError("");
    try {
      const response = await fetch("/api/comments/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: comment.id, liked: !liked }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLiked(data.liked); setCount(data.like_count);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo guardar tu reacción. Inténtalo de nuevo."); }
    finally { likeLock.current = false; setLiking(false); }
  }
  async function loadReplies(after?: PublicComment) {
    if (replyLock.current) return;
    replyLock.current = true; setLoading(true); setReplyError(""); setExpanded(true);
    try {
      const params = new URLSearchParams({ slug, parentId: comment.id });
      if (after) { params.set("beforeAt", after.published_at); params.set("beforeId", after.id); }
      const response = await fetch(`/api/comments?${params}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReplies(current => after ? [...current, ...data.comments.filter((row: PublicComment) => !current.some(item => item.id === row.id))] : data.comments);
      setMore(data.hasMore); setLoaded(true);
    } catch (failure) { setReplyError(failure instanceof Error ? failure.message : "No se pudieron cargar las respuestas."); }
    finally { replyLock.current = false; setLoading(false); }
  }
  return <article id={`comentario-${comment.id}`} className={`public-comment blog-comment${isReply ? " blog-reply" : ""}`}>
    <div className="comment-avatar" aria-hidden="true">{comment.author_name.trim().slice(0, 1).toLocaleUpperCase("es")}</div>
    <div className="comment-content"><header><strong>{comment.author_name}</strong><time dateTime={comment.published_at}>{date(comment.published_at)}</time></header><p className="comment-text">{comment.body}</p>
      <div className="comment-interactions"><button type="button" aria-pressed={liked} disabled={!enabled || liking} onClick={() => void like()} aria-label={`${liked ? "Quitar Me gusta" : "Me gusta"} al comentario de ${comment.author_name}`}><ThumbsUp size={16} aria-hidden="true" /><span>Me gusta</span><span className="like-count" aria-live="polite">{count}</span></button>
        {!isReply && <button ref={replyButton} type="button" disabled={!enabled} aria-expanded={replying} aria-controls={`responder-${comment.id}`} onClick={() => setReplying(value => !value)}><MessageCircle size={16} aria-hidden="true" />Responder</button>}
      </div>
      {error && <p role="alert" className="form-error">{error}</p>}
      {replying && <div id={`responder-${comment.id}`} className="inline-reply-form"><h4>Responder a {comment.author_name}</h4><CommentForm slug={slug} parentId={comment.id} ready={enabled} onCancel={() => { setReplying(false); replyButton.current?.focus(); }} /></div>}
      {comment.admin_reply && <div className="official-reply"><strong>Respuesta del museo</strong><p className="comment-text">{comment.admin_reply}</p></div>}
      {!isReply && comment.reply_count > 0 && <button className="thread-toggle" type="button" aria-expanded={expanded} aria-controls={`hilo-${comment.id}`} disabled={loading} onClick={() => { if (!loaded) void loadReplies(); else setExpanded(value => !value); }}><ChevronDown size={16} aria-hidden="true" />{expanded ? "Ocultar respuestas" : `Ver ${comment.reply_count} ${comment.reply_count === 1 ? "respuesta" : "respuestas"}`}</button>}
      {expanded && <div id={`hilo-${comment.id}`} className="comment-replies" aria-busy={loading}>
        {replies.map(reply => <CommentThread key={`${reply.id}:${reply.like_count}:${reply.liked}`} comment={reply} slug={slug} enabled={enabled} isReply />)}
        {loading && <p role="status">Cargando respuestas…</p>}
        {replyError && <div role="alert"><p className="form-error">{replyError}</p><button className="button-secondary" onClick={() => void loadReplies()}>Reintentar respuestas</button></div>}
        {loaded && !loading && !replyError && !replies.length && <p className="form-help">No hay respuestas publicadas en este momento.</p>}
        {more && !replyError && <button className="button-secondary" disabled={loading} onClick={() => void loadReplies(replies.at(-1))}>Cargar más respuestas</button>}
      </div>}
    </div>
  </article>;
}
