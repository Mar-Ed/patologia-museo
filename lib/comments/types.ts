export type PublicComment = {
  id: string; author_name: string; body: string; published_at: string;
  admin_reply: string | null; reply_updated_at: string | null;
  parent_id: string | null; like_count: number; liked: boolean; reply_count: number;
};
export type CommentStatus = "pending" | "approved" | "rejected";
export type AdminComment = PublicComment & {
  pathology_slug: string; email: string | null; status: CommentStatus;
  created_at: string; updated_at: string; rejection_reason: string | null; version: number;
  parent_comment?: { author_name: string; body: string; status: CommentStatus } | null;
};
export const statusLabels: Record<CommentStatus, string> = {
  pending: "Pendientes", approved: "Aprobados", rejected: "Rechazados",
};
