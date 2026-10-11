"use client";
import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AdminAuthForm({ mode }: { mode: "login" | "recovery" | "password" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const locked = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "password" && values.password !== values.confirm) { setError("Las contraseñas no coinciden."); return; }
    locked.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (data.redirect) { router.replace(data.redirect); router.refresh(); }
      else setMessage(data.message);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "No se pudo conectar. Vuelve a intentarlo."); }
    finally { locked.current = false; setBusy(false); }
  }
  return <form className="museum-form" onSubmit={submit}>
    <fieldset disabled={busy}>
      {mode !== "password" && <><label htmlFor="admin-email">Correo electrónico</label><input id="admin-email" name="email" type="email" autoComplete="username" required maxLength={254} /></>}
      {mode !== "recovery" && <><label htmlFor="admin-password">{mode === "password" ? "Nueva contraseña" : "Contraseña"}</label><div className="password-field"><input id="admin-password" name="password" type={show ? "text" : "password"} autoComplete={mode === "password" ? "new-password" : "current-password"} minLength={mode === "password" ? 12 : 1} maxLength={mode === "password" ? 128 : 1024} required /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={show}>{show ? "Ocultar" : "Mostrar"}</button></div></>}
      {mode === "password" && <><small>Usa al menos 12 caracteres y una contraseña única.</small><label htmlFor="admin-confirm">Repite la nueva contraseña</label><input id="admin-confirm" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" minLength={12} maxLength={128} required /></>}
    </fieldset>
    {error && <p role="alert" className="form-error">{error}</p>}
    {message && <p role="status" className="form-success">{message}</p>}
    <button className="button-primary" disabled={busy}>{busy ? "Procesando…" : mode === "login" ? "Iniciar sesión" : mode === "recovery" ? "Enviar enlace de recuperación" : "Guardar nueva contraseña"}</button>
    <Link className="form-link" href={mode === "login" ? "/admin/recuperar" : "/admin/login"}>{mode === "login" ? "Olvidé mi contraseña" : "Volver al inicio de sesión"}</Link>
  </form>;
}
