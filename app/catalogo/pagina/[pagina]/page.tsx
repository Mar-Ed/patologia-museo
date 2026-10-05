import { CatalogPageContent } from "@/components/catalog-page";
import { catalogPageNumbers, paginatedMetadata } from "@/lib/catalog-seo";

type Props = { params: Promise<{ pagina: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return catalogPageNumbers().map(pagina => ({ pagina })); }
export async function generateMetadata({ params }: Props) { return paginatedMetadata((await params).pagina); }
export default async function CatalogPaginationPage({ params }: Props) {
  paginatedMetadata((await params).pagina);
  return <CatalogPageContent />;
}
