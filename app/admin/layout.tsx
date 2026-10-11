import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración", robots: { index: false, follow: false, googleBot: { index: false, follow: false } }, alternates: { canonical: null } };
export default function AdminLayout({ children }: { children: React.ReactNode }) { return <main className="admin-shell site-shell">{children}</main>; }
