import type { Metadata } from "next";
import { PublicationsBrowser } from "@/components/publications-browser";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbs, pageMetadata } from "@/lib/seo";
import { publications } from "@/lib/publications";

export const metadata: Metadata = {
  ...pageMetadata("Publicaciones científicas", "Artículos, reportes de caso y notas técnicas de patología veterinaria. Consulta autores, resúmenes y enlaces a las revistas científicas.", "/publicaciones"),
};

export default function PublicationsPage() {
  return <main>
    <JsonLd data={breadcrumbs([{ name: "Inicio", path: "/" }, { name: "Publicaciones", path: "/publicaciones" }])} />
    <section className="page-intro"><div className="site-shell">
      <span data-reveal-initial="" data-reveal-delay="0" className="eyebrow">Investigación y conocimiento</span>
      <h1 data-reveal-initial="" data-reveal-delay="70">Publicaciones científicas</h1>
      <p data-reveal-initial="" data-reveal-delay="140">Investigaciones, reportes de caso y notas técnicas sobre patología veterinaria. Explora sus resúmenes y accede a cada publicación en su revista científica.</p>
    </div></section>
    <PublicationsBrowser items={publications} />
  </main>;
}
