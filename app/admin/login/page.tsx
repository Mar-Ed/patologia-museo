import { redirect } from "next/navigation";
import { adminSession } from "@/lib/supabase/server";
import { AdminAuthForm } from "@/components/admin-auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ changed?: string }> }) {
  let authenticated = false;
  try { authenticated = Boolean(await adminSession()); } catch { /* Login form can report a temporary outage. */ }
  if (authenticated) redirect("/admin");
  const { changed } = await searchParams;
  return <div className="admin-auth-card"><p className="eyebrow">Museo de Patología Veterinaria</p><h1>Acceso administrativo</h1><p className="form-help">Ingresa para revisar y responder los comentarios de la comunidad.</p>{changed && <p role="status" className="form-success">Contraseña actualizada. Inicia sesión con tu nueva contraseña.</p>}<AdminAuthForm mode="login" /></div>;
}
