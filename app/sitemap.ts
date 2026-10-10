import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";
import { getPathologyRecords } from "@/lib/pathology-content";
import { categoryInfo } from "@/lib/pathologies";
import { CATALOG_PAGE_SIZE, catalogPagePath } from "@/lib/catalog-pagination";

export default function sitemap(): MetadataRoute.Sitemap {
  const records = getPathologyRecords();
  const paths = ["/", "/museo", "/educacion", "/catalogo", "/publicaciones"];
  for (const category of ["all", ...Object.keys(categoryInfo)]) {
    const base = category === "all" ? "/catalogo" : `/catalogo/${category}`;
    if (category !== "all") paths.push(base);
    const count = records.filter(item => category === "all" || item.category === category).length;
    for (let page = 2; page <= Math.ceil(count / CATALOG_PAGE_SIZE); page++) paths.push(catalogPagePath(base, page));
  }
  paths.push(...records.map(item => `/patologias/${item.slug}`));
  // No invented modification dates: rebuilding does not mean the content changed.
  return [...new Set(paths)].map(path => ({ url: `${SITE_URL}${path}` }));
}
