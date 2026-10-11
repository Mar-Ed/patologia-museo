"use client";
export default function AdminError({ reset }: { reset: () => void }) {
  return <div className="admin-auth-card"><h1>No se pudo abrir el panel</h1><p role="alert">Comprueba tu conexión y vuelve a intentarlo.</p><button className="button-primary" onClick={reset}>Reintentar</button></div>;
}
