import { JsonLd } from "@/components/json-ld";
import { breadcrumbs } from "@/lib/seo";
import { categoryInfo } from "@/lib/pathologies";
import { CatalogBrowser } from "@/components/catalog-browser";
import { getCatalog } from "@/lib/pathology-content";
import type { CategoryId } from "@/lib/pathologies";

export function CatalogPageContent({ category }: { category?: CategoryId }) {
  return <><JsonLd data={breadcrumbs([{ name: "Inicio", path: "/" }, { name: "Catálogo", path: "/catalogo" }, ...(category ? [{ name: categoryInfo[category].short, path: `/catalogo/${category}` }] : [])])} /><CatalogBrowser items={getCatalog()} initialCategory={category} /></>;
}
