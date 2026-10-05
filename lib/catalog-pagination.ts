export const CATALOG_PAGE_SIZE = 24;
export const catalogPagePath = (base: string, page: number) => page === 1 ? base : `${base}/pagina/${page}`;
export function pageFromPath(path: string) {
  const match = path.match(/\/pagina\/([1-9]\d*)\/?$/);
  return match ? Number(match[1]) : 1;
}
