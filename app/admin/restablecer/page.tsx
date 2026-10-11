import { redirect } from "next/navigation";
import { adminSession } from "@/lib/supabase/server";
import { AdminAuthForm } from "@/components/admin-auth-form";
export default async function ResetPage() {
  const session = await adminSession();
  if (!session) redirect("/admin/recuperar?invalid=1");
  return <div className="admin-auth-card"><p className="eyebrow">Administración</p><h1>Nueva contraseña</h1><p className="form-help">Después de guardarla, volverás a iniciar sesión.</p><AdminAuthForm mode="password" /></div>;
}
