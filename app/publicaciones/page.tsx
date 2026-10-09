import type { Metadata } from "next";
import { Info } from "lucide-react";
import { PublicationsBrowser } from "@/components/publications-browser";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import { hasRealPublications, publications } from "@/lib/publications";

export const metadata: Metadata = {
  ...pageMetadata("Publicaciones científicas", hasRealPublications ? "Artículos, reportes de caso y revisiones de patología veterinaria en la biblioteca del museo." : "Biblioteca de publicaciones del Museo de Patología Veterinaria. Vista de demostración con datos ficticios.", "/publicaciones"),
  // Do not index fictitious research. This changes when real work is added.
  robots: { index: hasRealPublications, follow: true, googleBot: { index: hasRealPublications, follow: true } },
};

export default function PublicationsPage() {
  const hasExamples = publications.some(publication => publication.isDemo);
  return <main>
    <JsonLd data={breadcrumbs([{ name: "Inicio", path: "/" }, { name: "Publicaciones", path: "/publicaciones" }])} />
    <section className="page-intro"><div className="site-shell">
      <span data-reveal-initial="" data-reveal-delay="0" className="eyebrow">Investigación y conocimiento</span>
      <h1 data-reveal-initial="" data-reveal-delay="70">Publicaciones científicas</h1>
      <p data-reveal-initial="" data-reveal-delay="140">Un espacio para consultar artículos, reportes de caso y revisiones vinculados al estudio de la patología veterinaria.</p>
      {hasExamples && <aside data-reveal-initial="" data-reveal-delay="210" className="notice flex max-w-3xl items-start gap-3" aria-label="Aviso de contenido de demostración">
        <Info className="mt-1 size-5 shrink-0 text-accent-foreground" aria-hidden="true" />
        <div><strong className="block text-accent-foreground">Vista de demostración</strong><span className="text-sm text-foreground">Los registros marcados como ejemplos son ficticios. Sus títulos, autores y años sirven para mostrar el diseño; no representan publicaciones reales ni trabajos aprobados.</span></div>
      </aside>}
    </div></section>
    <PublicationsBrowser items={publications} />
  </main>;
}
