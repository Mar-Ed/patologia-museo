import { AdminAuthForm } from "@/components/admin-auth-form";
export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ invalid?: string }> }) {
  const { invalid } = await searchParams;
  return <div className="admin-auth-card"><p className="eyebrow">Administración</p><h1>Recuperar acceso</h1><p className="form-help">Solicita un enlace y ábrelo en este mismo navegador para elegir una nueva contraseña.</p>{invalid && <p role="alert" className="form-error">El enlace no es válido, ya se utilizó o venció. Solicita uno nuevo.</p>}<AdminAuthForm mode="recovery" /></div>;
}
