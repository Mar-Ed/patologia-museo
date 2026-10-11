import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { pathologies, normalizeText, slugify, speciesOf, categoryOf, type Pathology } from "./pathologies";
import { scientificReferences, type ScientificReference } from "./scientific-profiles";
import { pathologyText } from "./content/patologias";
import type { LocalCase } from "./case-editorial";
import type { DocumentSection } from "./document-sections";
import { pathologyVideos, type PathologyVideo } from "./pathology-videos";
import { getPreparedImage, type PreparedImage } from "./prepared-media";

export type ScientificSection = { id: string; title: string; paragraphs: string[]; points?: string[]; referenceIds: string[] };
export type CaseContent = { item: Pathology; system: string; gallery: string[]; galleryPreviews: (PreparedImage | undefined)[]; videos: PathologyVideo[]; documentSections: DocumentSection[]; sections: ScientificSection[]; localCases: LocalCase[]; references: ScientificReference[]; sourceCount: number; study: { question: string; answer: string }[] };
const root = path.join(process.cwd(), "public", "patologias");
const aliases: Record<string, string> = {
  "diprosopia-parcial-en-ovino-ii": "diprosopria-parcial-en-ovino",
  "hidranencefalia-y-cifosis-congenita-grave-en-bovino": "hidranencefaclia-y-cifosis-congenita-grave-en-bovino",
  "hendidura-de-paladar-o-palatosquisis-en-ternero": "hendidura-de-paladar-o-palatosquisis-en-ternero-de-raza-holstein",
  "anomalia-glosomandibular-congenita-con-hipoplasia-mandibular": "anomalia-glosomandibular-congenita-con-hipoplasia-mandibular-severa-en-un-cerdo",
  "pleuritis-cronica-granulomatosa": "pleuritis-cronica-granulomatosa-amigdalitis-cronica-y-colangitis",
};
const urlFor = (folder: string, file: string) => `/patologias/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;
const getFolders = () => fs.existsSync(root) ? fs.readdirSync(root, { withFileTypes: true }).filter(x => x.isDirectory()).map(x => x.name).sort((a, b) => a.localeCompare(b, "es")) : [];

export const getPathologyRecords = cache((): Pathology[] => {
  const linked = new Set(pathologies.map(item => aliases[item.slug] ?? item.slug));
  const additions = getFolders().filter(folder => !linked.has(normalizeText(folder)));
  return [...pathologies, ...additions.map((folder, index) => {
    const name = folder.replace(/-/g, " ").replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase("es"));
    return { id: `MPV-${String(pathologies.length + index + 1).padStart(3, "0")}`, slug: slugify(folder), name, species: speciesOf(name), category: categoryOf(name), summary: "" };
  })];
});

export const getCaseContent = cache((slug: string): CaseContent | undefined => {
  const original = getPathologyRecords().find(item => item.slug === slug);
  if (!original) return undefined;
  const folders = getFolders();
  const folder = folders.find(x => normalizeText(x) === (aliases[slug] ?? slug));
  const files = folder ? fs.readdirSync(path.join(root, folder)).sort((a, b) => a.localeCompare(b, "es", { numeric: true })) : [];
  const text = pathologyText[slug];
  if (!text) throw new Error(`Missing edited pathology content for "${slug}". Add its TypeScript case to lib/content/patologias.`);
  const defaultGalleryFiles = files.filter(x => /^catalogo.*\.webp$/i.test(x));
  const orderedFiles = text.galleryOrder ?? [];
  if (new Set(orderedFiles).size !== orderedFiles.length || orderedFiles.some(file => !/^(portada|catalogo.*)\.webp$/i.test(file) || !files.includes(file))) {
    throw new Error(`Invalid gallery order for "${slug}". Use unique existing image filenames.`);
  }
  const gallery = [...orderedFiles, ...defaultGalleryFiles.filter(file => !orderedFiles.includes(file))].map(file => urlFor(folder!, file));
  const videos = (pathologyVideos[slug] ?? []).map(video => {
    const preview = getPreparedImage(video.poster);
    return preview ? { ...video, posterDisplay: preview.src, posterBlur: preview.blurDataURL } : video;
  });
  const cover = files.find(x => /^portada\.webp$/i.test(x));
  const { documentSections, sections, localCases, system, sourceCount } = text;
  const referenceIds = [...new Set(sections.flatMap(section => section.referenceIds))];
  const item: Pathology = { ...original, summary: text.summary, cover: text.cover ?? (cover ? urlFor(folder!, cover) : undefined), galleryCount: gallery.length, documentCount: sourceCount };
  const preparedCover = item.cover ? getPreparedImage(item.cover) : undefined;
  if (preparedCover) {
    item.coverThumbnail = preparedCover.thumbnail;
    item.coverDisplay = preparedCover.src;
    item.coverBlur = preparedCover.blurDataURL;
  }
  if (slug === "hemopericardio") item.species = "Bovino";
  if (slug === "atresia-anal-y-amelia-posterior") item.species = "Ovino";
  if (slug === "hidronefrosis-unilateral-en-bovino-y-porcino") item.species = "Bovino / Porcino";

  return {
    item, system, gallery, galleryPreviews: gallery.map(getPreparedImage), videos, documentSections, sections, localCases,
    references: referenceIds.map(id => scientificReferences[id]), sourceCount,
    study: [
      { question: "¿Cómo se define esta alteración?", answer: sections[0].paragraphs.join(" ") },
      { question: "¿Qué estructuras deben evaluarse?", answer: sections[2].points?.join(" ") || sections[2].paragraphs.join(" ") },
      { question: "¿Qué permite diferenciar o confirmar el diagnóstico?", answer: sections[3].points?.join(" ") || sections[3].paragraphs.join(" ") },
    ],
  };
});
export const getCatalog = cache((): Pathology[] => {
  const file = path.join(process.cwd(), ".generated", "catalog.json");
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  return getPathologyRecords().map(item => getCaseContent(item.slug)!.item);
});
