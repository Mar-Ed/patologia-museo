import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { CatalogPageContent } from "@/components/catalog-page";

export const metadata: Metadata = pageMetadata("Catálogo", "Catálogo digital de patologías y especímenes veterinarios de la UNC.", "/catalogo");

export default function CatalogPage() {
  return <CatalogPageContent />;
}
