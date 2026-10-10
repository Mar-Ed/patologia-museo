"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, ChevronDown, FileText, Search, X } from "lucide-react";
import { filterPublications, type Publication } from "@/lib/publications";
import styles from "./publications-browser.module.css";

export function PublicationsBrowser({ items }: { items: Publication[] }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const years = useMemo(() => [...new Set(items.map(item => item.year))].sort((a, b) => b - a), [items]);
  const types = useMemo(() => [...new Set(items.map(item => item.type))], [items]);
  const filtered = useMemo(() => filterPublications(items, query, year, type), [items, query, year, type]);
  const hasFilters = Boolean(query || year || type);

  function clearFilters() {
    setQuery("");
    setYear("");
    setType("");
  }

  return <section className={`section ${styles.library}`} aria-labelledby="biblioteca-titulo">
    <div className="site-shell">
      <div className={styles.heading} data-scroll-reveal="">
        <div><span className="eyebrow">Biblioteca del museo</span><h2 id="biblioteca-titulo">Explorar publicaciones</h2></div>
        <p>Encuentra trabajos por título, autor o tema.</p>
      </div>
      <div className={styles.filters} role="search" aria-label="Buscar publicaciones">
        <label className={styles.field} htmlFor="publicaciones-busqueda">
          <span>Buscar publicación</span>
          <div className={styles.searchInput}><Search size={19} aria-hidden="true" /><input id="publicaciones-busqueda" type="search" placeholder="Título, autor o palabra clave" value={query} onChange={event => setQuery(event.target.value)} aria-controls="publicaciones-listado" /></div>
        </label>
        <label className={styles.field} htmlFor="publicaciones-anio"><span>Año</span><select id="publicaciones-anio" value={year} onChange={event => setYear(event.target.value)} aria-controls="publicaciones-listado"><option value="">Todos los años</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className={styles.field} htmlFor="publicaciones-tipo"><span>Tipo de trabajo</span><select id="publicaciones-tipo" value={type} onChange={event => setType(event.target.value)} aria-controls="publicaciones-listado"><option value="">Todos los tipos</option>{types.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      </div>
      <div className={styles.results}>
        <p role="status" aria-atomic="true">{filtered.length} {filtered.length === 1 ? "publicación encontrada" : "publicaciones encontradas"}</p>
        {hasFilters && <button className={styles.clear} onClick={clearFilters}><X size={15} aria-hidden="true" />Limpiar filtros</button>}
      </div>
      <div id="publicaciones-listado" className={styles.grid}>
        {filtered.map(publication => <article key={publication.id} className={styles.card} data-scroll-reveal="" aria-labelledby={`titulo-${publication.id}`}>
          <div className={styles.cardTop}><span className={styles.type}><FileText size={16} aria-hidden="true" />{publication.type}</span><span className={styles.year}>{publication.dateLabel}</span></div>
          <span className={styles.topic}>{publication.topic}</span>
          <h3 id={`titulo-${publication.id}`}>{publication.title}</h3>
          <p className={styles.authors}>{publication.authors.join(" · ")}</p>
          <p className={styles.journal}><BookOpen size={16} aria-hidden="true" /><span>{publication.journal}</span></p>
          <p className={styles.summary}>{publication.summary}</p>
          <ul className={styles.tags} aria-label="Palabras clave">{publication.keywords.map(keyword => <li key={keyword}>{keyword}</li>)}</ul>
          <div className={styles.cardBottom}>
            <details className={styles.details}>
              <summary><span>Ver resumen completo</span><ChevronDown size={17} aria-hidden="true" /></summary>
              <div className={styles.abstract}><h4>Resumen</h4><p>{publication.abstract}</p></div>
            </details>
            {publication.url.startsWith("https://") && <a className={styles.readLink} href={publication.url} target="_blank" rel="noopener noreferrer">Leer publicación<span className="sr-only">: {publication.title} (abre en otra pestaña)</span><ArrowUpRight size={17} aria-hidden="true" /></a>}
            <p className={styles.doi}>DOI: {publication.url.replace("https://doi.org/", "")}</p>
          </div>
        </article>)}
        {filtered.length === 0 && <div className={styles.empty}><BookOpen size={30} strokeWidth={1.4} aria-hidden="true" /><h3>No encontramos publicaciones</h3><p>Prueba otro título o palabra clave, o limpia los filtros para consultar todos los trabajos.</p>{hasFilters && <button className="button-secondary" onClick={clearFilters}>Mostrar todas las publicaciones</button>}</div>}
      </div>
    </div>
  </section>;
}
