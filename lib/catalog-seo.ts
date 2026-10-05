import { notFound } from "next/navigation";
import { getCatalog } from "./pathology-content";
import { categoryInfo, type CategoryId } from "./pathologies";
import { CATALOG_PAGE_SIZE, catalogPagePath } from "./catalog-pagination";
import { pageMetadata } from "./seo";

export function catalogPageNumbers(category?: CategoryId) {
  const count = getCatalog().filter(item => !category || item.category === category).length;
  return Array.from({ length: Math.max(0, Math.ceil(count / CATALOG_PAGE_SIZE) - 1) }, (_, i) => String(i + 2));
}
export function paginatedMetadata(page: string, category?: CategoryId) {
  if (!catalogPageNumbers(category).includes(page)) notFound();
  const info = category ? categoryInfo[category] : undefined;
  return pageMetadata(`${info?.short ?? "Catálogo"} · Página ${page}`, info?.description ?? "Catálogo digital de patologías y especímenes veterinarios de la UNC.", catalogPagePath(category ? `/catalogo/${category}` : "/catalogo", Number(page)));
}
