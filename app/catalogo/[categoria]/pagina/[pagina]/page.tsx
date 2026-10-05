import { notFound } from "next/navigation";
import { CatalogPageContent } from "@/components/catalog-page";
import { catalogPageNumbers, paginatedMetadata } from "@/lib/catalog-seo";
import { categoryInfo, type CategoryId } from "@/lib/pathologies";

type Props = { params: Promise<{ categoria: string; pagina: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return (Object.keys(categoryInfo) as CategoryId[]).flatMap(categoria => catalogPageNumbers(categoria).map(pagina => ({ categoria, pagina })));
}
function category(value: string): CategoryId {
  if (!Object.hasOwn(categoryInfo, value)) notFound();
  return value as CategoryId;
}
export async function generateMetadata({ params }: Props) {
  const { categoria, pagina } = await params;
  return paginatedMetadata(pagina, category(categoria));
}
export default async function CategoryPaginationPage({ params }: Props) {
  const { categoria, pagina } = await params;
  const id = category(categoria);
  paginatedMetadata(pagina, id);
  return <CatalogPageContent category={id} />;
}
