import { redirect } from "next/navigation";
import { adminSession } from "@/lib/supabase/server";
import { getPathologyIndex } from "@/lib/pathology-index";
import { AdminComments } from "@/components/admin-comments";
export default async function AdminPage() {
  const session = await adminSession();
  if (!session) redirect("/admin/login");
  return <AdminComments email={session.user.email || "Administrador"} pathologies={getPathologyIndex()} />;
}
