import type { Metadata } from "next";
import { SITE_URL } from "./site-config";

export const SITE_NAME = "Museo de Patología Veterinaria de la Universidad Nacional de Cajamarca";
export const SITE_DESCRIPTION = "Colección académica de patología veterinaria de la Universidad Nacional de Cajamarca: especímenes, alteraciones anatómicas y fichas educativas.";
export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = [{ url: `${SITE_URL}/social-card.png`, width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title, description, alternates: { canonical: path },
    openGraph: { title, description, url, siteName: SITE_NAME, locale: "es_PE", type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: images.map(image => image.url) },
  };
}
export function breadcrumbs(entries: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: entries.map((entry, i) => ({ "@type": "ListItem", position: i + 1, name: entry.name, item: `${SITE_URL}${entry.path}` })) };
}
