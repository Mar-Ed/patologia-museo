import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowDown } from "lucide-react";
import type { Metadata } from "next";
import { pageMetadata, breadcrumbs } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-config";
import { JsonLd } from "@/components/json-ld";
import { PathologyTabs } from "@/components/pathology-tabs";
import { categoryInfo } from "@/lib/pathologies";
import { getCaseContent, getPathologyRecords } from "@/lib/pathology-content";

export const dynamicParams = false;

export function generateStaticParams() { return getPathologyRecords().map(item => ({ slug: item.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = getCaseContent(slug)?.item; return item ? pageMetadata(`${item.name} · ${item.id}`, item.summary, `/patologias/${item.slug}`) : {}; }

export default async function PathologyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const content = getCaseContent(slug); if (!content) notFound();
  const { item } = content;
  return <main className="scientific-case"><JsonLd data={breadcrumbs([{ name: "Inicio", path: "/" }, { name: "Catálogo", path: "/catalogo" }, { name: categoryInfo[item.category].short, path: `/catalogo/${item.category}` }, { name: item.name, path: `/patologias/${item.slug}` }])} /><JsonLd data={{ "@context": "https://schema.org", "@type": "LearningResource", name: item.name, identifier: item.id, description: item.summary, url: `${SITE_URL}/patologias/${item.slug}`, inLanguage: "es-PE", learningResourceType: "Ficha educativa", ...(item.cover ? { image: `${SITE_URL}${item.coverDisplay ?? item.cover}` } : {}), publisher: { "@id": `${SITE_URL}/#museum` }, citation: content.references.map(reference => reference.url) }} /><section className="case-hero"><div className="site-shell"><div className="case-breadcrumb"><Link href="/catalogo"><ArrowLeft size={14} />Colección</Link><span>/</span><span>{categoryInfo[item.category].short}</span><span className="case-breadcrumb-code">{item.id}</span></div><div className={`case-hero-grid ${!item.cover ? "case-hero-text-only" : ""}`}><div className="case-hero-copy"><div className="case-labels"><span>Patología veterinaria</span>{item.species !== "Por determinar" && <span>{item.species}</span>}</div><h1>{item.name}</h1><p className="case-lead">{item.summary}</p><div className="case-hero-bottom"><span>{content.system}</span><a href="#ficha-cientifica">Explorar la ficha<ArrowDown size={15} /></a></div></div>{item.cover && <figure className="case-hero-image"><Image src={item.coverDisplay ?? item.cover} alt={`Espécimen de ${item.name}`} width={900} height={1000} sizes="(max-width: 540px) 90vw, (max-width: 800px) 460px, 440px" preload unoptimized={!!item.coverDisplay} placeholder={item.coverBlur ? "blur" : "empty"} blurDataURL={item.coverBlur} className="case-specimen" /></figure>}</div></div></section><div id="ficha-cientifica"><PathologyTabs content={content} /></div></main>;
}
