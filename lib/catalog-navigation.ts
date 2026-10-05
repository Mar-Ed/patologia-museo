import { categoryInfo, type CategoryId } from "./pathologies";

export type CatalogCategory = "all" | CategoryId;
export const catalogPath = (category: CatalogCategory) => category === "all" ? "/catalogo" : `/catalogo/${category}`;
export function categoryFromPath(pathname: string, fallback: CatalogCategory = "all"): CatalogCategory {
  if (pathname.replace(/\/$/, "") === "/catalogo") return "all";
  if (pathname.startsWith("/catalogo/pagina/")) return "all";
  const candidate = pathname.replace(/\/$/, "").split("/")[2];
  return candidate && Object.hasOwn(categoryInfo, candidate) ? candidate as CategoryId : fallback;
}

// Leave modified clicks and new-tab navigation to the browser.
export function isPlainNavigation(event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
