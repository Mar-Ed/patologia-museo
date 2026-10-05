import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import { CatalogPageContent } from "@/components/catalog-page";
import { categoryInfo, type CategoryId } from "@/lib/pathologies";

type Props = { params: Promise<{ categoria: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(categoryInfo).map(categoria => ({ categoria }));
}

function getCategory(value: string): CategoryId {
  if (!Object.hasOwn(categoryInfo, value)) notFound();
  return value as CategoryId;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategory((await params).categoria);
  const info = categoryInfo[category];
  return pageMetadata(`${info.short} · Catálogo`, info.description, `/catalogo/${category}`);
}

export default async function CategoryCatalogPage({ params }: Props) {
  return <CatalogPageContent category={getCategory((await params).categoria)} />;
}
