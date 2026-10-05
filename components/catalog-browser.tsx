"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { SITE_URL } from "@/lib/site-config";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PathologyCard } from "@/components/pathology-card";
import { categoryInfo, normalizeText, type Pathology } from "@/lib/pathologies";
import { catalogPath, categoryFromPath, isPlainNavigation, type CatalogCategory } from "@/lib/catalog-navigation";

import { CATALOG_PAGE_SIZE as PAGE_SIZE, catalogPagePath, pageFromPath } from "@/lib/catalog-pagination";
const categories = [{ id: "all" as CatalogCategory, label: "Todas" }, ...Object.entries(categoryInfo).map(([id, value]) => ({ id: id as CatalogCategory, label: value.short }))];

export function CatalogBrowser({ items, initialCategory = "all" }: { items: Pathology[]; initialCategory?: CatalogCategory }) {
  const pathname = usePathname();
  const category = categoryFromPath(pathname, initialCategory);
  const info = category === "all" ? undefined : categoryInfo[category];
  const [query, setQuery] = useState("");
  const [species, setSpecies] = useState("");
  const [page, setPage] = useState({ key: "", limit: PAGE_SIZE });
  const currentPage = pageFromPath(pathname);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const filterKey = `${category}|${currentPage}|${query}|${species}`;
  const limit = page.key === filterKey ? page.limit : PAGE_SIZE;
  const speciesList = useMemo(() => [...new Set(items.flatMap(x => x.species.split(" / ")))].sort(), [items]);
  const searchable = useMemo(() => items.map(item => ({ item, text: normalizeText(`${item.name} ${item.species} ${item.id} ${categoryInfo[item.category].name}`) })), [items]);
  const filtered = useMemo(() => {
    const term = normalizeText(query.trim());
    return searchable.filter(({ item, text }) => (!term || text.includes(term)) && (!species || item.species.split(" / ").includes(species)) && (category === "all" || item.category === category)).map(({ item }) => item);
  }, [searchable, query, species, category]);

  useEffect(() => {
    document.title = `${info ? `${info.short} · Catálogo` : "Catálogo"}${currentPage > 1 ? ` · Página ${currentPage}` : ""} | Museo de Patología Veterinaria`;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = `${SITE_URL}${catalogPagePath(catalogPath(category), currentPage)}`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = info?.description ?? "Catálogo digital de patologías y especímenes veterinarios de la UNC.";
    const url = `${SITE_URL}${catalogPagePath(catalogPath(category), currentPage)}`;
    for (const [selector, value] of [
      ['meta[property="og:url"]', url],
      ['meta[property="og:title"]', document.title],
      ['meta[name="twitter:title"]', document.title],
      ['meta[property="og:description"]', description?.content ?? ""],
      ['meta[name="twitter:description"]', description?.content ?? ""],
    ]) {
      const meta = document.querySelector<HTMLMetaElement>(selector);
      if (meta) meta.content = value;
    }
  }, [category, info, currentPage]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, next: CatalogCategory) {
    if (!isPlainNavigation(event)) return;
    event.preventDefault();
    if (next !== category || currentPage !== 1) window.history.pushState(null, "", catalogPath(next));
  }

  return <main>
    <section className="page-intro"><div className="site-shell">
      <nav data-reveal-initial="" data-reveal-delay="0" aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[#66706c]">
        <Link href="/" className="hover:underline">Inicio</Link><span aria-hidden="true">/</span>
        {info ? <><Link href="/catalogo" prefetch={false} onClick={event => navigate(event, "all")} className="hover:underline">Catálogo</Link><span aria-hidden="true">/</span><span aria-current="page">{info.short}</span></> : <span aria-current="page">Catálogo</span>}
      </nav>
      <span data-reveal-initial="" data-reveal-delay="60" className="eyebrow">Archivo general</span><h1 data-reveal-initial="" data-reveal-delay="130">{info?.name ?? "Catálogo de patologías"}</h1>
      <p data-reveal-initial="" data-reveal-delay="200">{info?.description ?? "Busca por nombre, especie o código institucional y consulta las fichas educativas de la colección."}</p>
    </div></section>
    <section className="section"><div className="site-shell">
      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <label className="relative"><span className="sr-only">Buscar en el catálogo</span><Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#66706c]" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar patología, especie o código" className="h-13 rounded-none border-[#d9ddd8] bg-white pl-11 text-base shadow-none" /></label>
        <label><span className="sr-only">Filtrar por especie</span><NativeSelect value={species} onChange={event => setSpecies(event.target.value)} className="h-13 w-full rounded-none border-[#d9ddd8] bg-white text-base shadow-none"><NativeSelectOption value="">Todas las especies</NativeSelectOption>{speciesList.map(value => <NativeSelectOption key={value} value={value}>{value}</NativeSelectOption>)}</NativeSelect></label>
      </div>
      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Clasificación">{categories.map(item => <Link key={item.id} href={catalogPath(item.id)} prefetch={false} onClick={event => navigate(event, item.id)} aria-current={category === item.id ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7a2c2c] ${category === item.id ? "border-[#7a2c2c] bg-[#7a2c2c] text-white" : "border-[#d9ddd8] hover:border-[#7a2c2c]"}`}>{item.label}</Link>)}</nav>
      <p className="my-6 text-sm text-[#66706c]" aria-live="polite">{filtered.length} registros encontrados{filtered.length > 0 && ` · Mostrando ${(query || species ? 0 : offset) + 1}–${Math.min(filtered.length, (query || species ? 0 : offset) + limit)}`}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.length ? filtered.slice(query || species ? 0 : offset, (query || species ? 0 : offset) + limit).map(item => <PathologyCard key={item.id} item={item} />) : <div className="col-span-full border border-dashed border-[#d9ddd8] p-10 text-center text-[#66706c]">No hay registros que coincidan con los filtros seleccionados.</div>}</div>
      {filtered.length > (query || species ? 0 : offset) + limit && <div className="mt-8 flex justify-center"><button className="button-secondary" onClick={() => setPage({ key: filterKey, limit: limit + PAGE_SIZE })}>Cargar más patologías</button></div>}
      {!query && !species && Math.ceil(filtered.length / PAGE_SIZE) > 1 && <nav className="mt-8 flex flex-wrap justify-center gap-3" aria-label="Páginas del catálogo">{Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }, (_, i) => <Link key={i} href={catalogPagePath(catalogPath(category), i + 1)} prefetch={false} aria-current={currentPage === i + 1 ? "page" : undefined} className="button-secondary">Página {i + 1}</Link>)}</nav>}
    </div></section>
  </main>;
}
