"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";

export function CommentForm({ slug, ready, parentId = null, onCancel }: { slug: string; ready: boolean; parentId?: string | null; onCancel?: () => void }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const locked = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const request = useRef<{ payload: string; id: string } | null>(null);
  const prefix = parentId ? `reply-${parentId}` : "comment";
  useEffect(() => { if (parentId) nameInput.current?.focus(); }, [parentId]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || !ready) return;
    locked.current = true; setSending(true); setError(""); setMessage("");
    const form = event.currentTarget;
    try {
      const values = new FormData(form);
      const payload = { slug, parentId, name: values.get("name"), body: values.get("body"), email: values.get("email") || "", website: values.get("website") || "", consent: values.get("consent") === "on" };
      const signature = JSON.stringify(payload);
      if (request.current?.payload !== signature) request.current = { payload: signature, id: crypto.randomUUID() };
      const response = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, requestId: request.current.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(data.message); form.reset(); request.current = null;
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo confirmar el envío. Puedes volver a intentarlo; tu texto se conserva."); }
    finally { locked.current = false; setSending(false); }
  }
  return <form className="museum-form blog-comment-form" onSubmit={submit}>
    <fieldset disabled={sending}><div className="comment-identity-fields"><div><label htmlFor={`${prefix}-name`}>Nombre o seudónimo</label><input ref={nameInput} id={`${prefix}-name`} name="name" autoComplete="nickname" required minLength={2} maxLength={60} /></div>
      <div><label htmlFor={`${prefix}-email`}>Correo electrónico <span>(opcional)</span></label><input id={`${prefix}-email`} name="email" type="email" autoComplete="email" maxLength={254} aria-describedby={`${prefix}-email-help`} /><small id={`${prefix}-email-help`}>Solo para contacto. No se publicará.</small></div></div>
      <label htmlFor={`${prefix}-body`}>{parentId ? "Tu respuesta" : "Comentario"}</label><textarea id={`${prefix}-body`} name="body" required minLength={10} maxLength={2000} rows={parentId ? 3 : 4} aria-describedby={`${prefix}-body-help`} placeholder={parentId ? "Comparte tu respuesta…" : "¿Qué te gustaría preguntar o compartir sobre esta ficha?"} /><small id={`${prefix}-body-help`}>Entre 10 y 2000 caracteres. Evita incluir datos personales o sensibles.</small>
      <div className="form-trap" aria-hidden="true"><label htmlFor={`${prefix}-website`}>Sitio web</label><input id={`${prefix}-website`} name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="check-label"><input type="checkbox" name="consent" required /><span>Acepto que mi nombre o seudónimo y texto se publiquen después de su revisión.</span></label>
    </fieldset>
    {error && <p role="alert" className="form-error">{error}</p>}{message && <p role="status" className="form-success">{message}</p>}
    <div className="comment-form-actions"><button className="button-primary" disabled={sending || !ready}>{sending ? "Enviando…" : parentId ? "Enviar respuesta" : "Enviar comentario"}</button>{onCancel && <button type="button" className="button-secondary" disabled={sending} onClick={onCancel}>Cerrar respuesta</button>}<span className="form-help">Se publicará después de su aprobación.</span></div>
  </form>;
}
