"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Expand, Microscope, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/scientific-tabs";
import { DocumentSynthesis } from "@/components/document-synthesis";
import type { CaseContent, ScientificSection } from "@/lib/pathology-content";
import type { PathologyVideo } from "@/lib/pathology-videos";
import type { PreparedImage } from "@/lib/prepared-media";

const GalleryViewer = dynamic(() => import("./gallery-viewer").then(module => module.GalleryViewer), { ssr: false });

const navigation = [["panorama", "Panorama"], ["anatomia", "Anatomía patológica"], ["diagnostico", "Diagnóstico"], ["galeria", "Galería"], ["estudio", "Estudio"], ["referencias", "Bibliografía"]];

function Section({ section, content }: { section: ScientificSection; content: CaseContent }) {
  const document = content.documentSections.find(item => item.id === section.id);
  return <section id={section.id} className="scientific-section">
    <h3>{section.title}</h3>
    {document && <DocumentSynthesis document={document} />}
    {document && <span className="case-kicker">Contexto científico complementario</span>}
    {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {section.points && <ul className="scientific-points">{section.points.map(point => <li key={point}><span aria-hidden="true" /><p>{point}</p></li>)}</ul>}
    <div className="section-citations" aria-label="Fuentes de la sección">{section.referenceIds.map(id => { const reference = content.references.find(x => x.id === id); return reference && <a key={id} href={reference.url} target="_blank" rel="noreferrer">{reference.publisher}<ArrowUpRight size={12} /></a>; })}</div>
  </section>;
}

function VideoRecord({ video, name, index }: { video: PathologyVideo; name: string; index: number }) {
  const [started, setStarted] = useState(false);
  const title = video.title ?? `Registro audiovisual de ${name}, video ${index + 1}`;
  return <figure className="video-record">
    <div className="video-stage">
      {started ? <iframe src={video.embedUrl} title={title} allow="autoplay; fullscreen" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin" /> : <Image src={video.posterDisplay ?? video.poster} alt={`Vista previa de ${name}`}
        fill sizes="(max-width: 800px) 90vw, 550px" unoptimized={!!video.posterDisplay} placeholder={video.posterBlur ? "blur" : "empty"} blurDataURL={video.posterBlur} className="video-poster" />}
      {!started && <button type="button" className="video-play-overlay"
        onClick={() => setStarted(true)} aria-label={`Abrir reproductor de ${name}, video ${index + 1}`}>
        <span className="video-play-icon"><Play size={30} fill="currentColor" strokeWidth={1.3} aria-hidden="true" /></span>
        <span className="video-play-label">Ver video</span>
      </button>}
    </div>
    <figcaption className="video-caption">{video.title && <span>{video.title}</span>}<a href={video.url} target="_blank" rel="noopener noreferrer">Abrir en Drive<ArrowUpRight size={14} aria-hidden="true" /></a></figcaption>
  </figure>;
}

function VideoGallery({ videos, name }: { videos: PathologyVideo[]; name: string }) {
  return <><div className="gallery-heading"><div><span className="case-kicker">Colección audiovisual</span><h2>La anatomía en movimiento</h2></div><span className="gallery-total">{videos.length} {videos.length === 1 ? "video" : "videos"}</span></div><div className={`scientific-gallery video-gallery ${videos.length === 1 ? "video-gallery-single" : ""}`}>{videos.map((video, index) => <VideoRecord key={video.url} video={video} name={name} index={index} />)}</div><p className="editorial-note video-access-note">Si Drive solicita acceso o no reproduce el archivo, utiliza «Abrir en Drive».</p></>;
}

function Gallery({ images, previews, name }: { images: string[]; previews: (PreparedImage | undefined)[]; name: string }) {
  const [active, setActive] = useState<number | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  if (!images.length) return <div className="gallery-empty"><Microscope size={32} strokeWidth={1.2} /><h3>Estudio anatómico</h3><p>Consulta las características morfológicas y los criterios de diagnóstico en esta ficha. Este caso no cuenta con fotografías disponibles en la colección digital.</p></div>;
  return <>
    <div className="gallery-heading"><div><span className="case-kicker">Colección visual</span><h2>Una lectura de la anatomía</h2><p className="gallery-heading-copy">Explora las fotografías del espécimen. Selecciona una imagen para ampliarla.</p></div><span className="gallery-total">{images.length} {images.length === 1 ? "fotografía" : "fotografías"}</span></div>
    <div className="scientific-gallery">{images.map((src, index) => {
      const preview = previews[index];
      return <button key={src} className="gallery-image" onClick={event => { trigger.current = event.currentTarget; setActive(index); }} aria-label={`Ampliar fotografía de ${name}, posición ${index + 1}`}>
        <Image src={preview?.src ?? src} alt={`Registro anatómico de ${name}`} width={1000} height={850} sizes="(max-width: 540px) 90vw, (max-width: 1024px) 45vw, 370px" unoptimized={!!preview} placeholder={preview ? "blur" : "empty"} blurDataURL={preview?.blurDataURL} className="gallery-photo" />
        <span className="gallery-expand" aria-hidden="true"><Expand size={18} /></span>
      </button>;
    })}</div>
    {active !== null && <GalleryViewer images={images} name={name} initialIndex={active} onClose={() => { setActive(null); trigger.current?.focus(); }} />}
  </>;
}

export function PathologyTabs({ content }: { content: CaseContent }) {
  const { item, sections, localCases, study } = content;
  const [tab, setTab] = useState("panorama");
  const [revealed, setRevealed] = useState<number[]>([]);
  const section = (id: string) => <Section key={id} section={sections.find(x => x.id === id)!} content={content} />;
  return <Tabs value={tab} onValueChange={setTab} className="case-workspace gap-0">
    <div className="case-tabbar"><div className="site-shell"><TabsList className="case-tablist">{navigation.map(([id, name]) => <TabsTrigger key={id} value={id} className="case-tab">{name}{id === "galeria" && (content.videos.length || content.gallery.length) > 0 && <span>{content.videos.length + content.gallery.length}</span>}</TabsTrigger>)}</TabsList></div></div>
    <div className={`site-shell case-body ${tab === "galeria" ? "case-body-gallery" : ""}`}>
      <div className="case-main">
        <TabsContent value="panorama"><div className="chapter-heading"><span className="case-kicker">Comprender la alteración</span><h2>De la forma al mecanismo</h2></div>{section("concepto")}{section("mecanismo")}<div className="clinical-insight"><BookOpen size={22} strokeWidth={1.4} /><div><span>Perspectiva veterinaria</span>{sections.find(x => x.id === "relevancia")!.paragraphs.map(text => <p key={text}>{text}</p>)}</div></div></TabsContent>
        <TabsContent value="anatomia"><div className="chapter-heading"><span className="case-kicker">Lectura morfológica</span><h2>Qué observar, qué describir</h2></div>{section("morfologia")}{localCases.length > 0 && <section className="local-findings"><div className="local-findings-heading"><Microscope size={21} strokeWidth={1.4} /><div><span className="case-kicker">Reportes de la colección</span><h3>Observaciones clínicas</h3></div></div>{localCases.map(record => <article key={record.title} className="local-case"><h4>{record.title}</h4><ul>{record.facts.map(fact => <li key={fact}>{fact}</li>)}</ul></article>)}<p className="editorial-note">Estas observaciones sintetizan los reportes locales. No se extrapolan a todos los animales con la misma patología ni se utilizan para confirmar una etiología no demostrada.</p></section>}</TabsContent>
        <TabsContent value="diagnostico"><div className="chapter-heading"><span className="case-kicker">Razonamiento clínico</span><h2>Interpretar con evidencia</h2></div>{section("diagnostico")}{section("relevancia")}<div className="diagnostic-principle"><Check size={20} /><p>La descripción de una lesión, su clasificación y la identificación de su causa son etapas distintas del diagnóstico.</p></div></TabsContent>
        <TabsContent value="galeria" lazy>
          {content.videos.length > 0 && <section className="case-media-section" aria-label="Videos del espécimen"><VideoGallery videos={content.videos} name={item.name} /></section>}
          {(content.gallery.length > 0 || content.videos.length === 0) && <section className="case-media-section" aria-label="Fotografías del espécimen"><Gallery images={content.gallery} previews={content.galleryPreviews} name={item.name} /></section>}
        </TabsContent>
        <TabsContent value="estudio"><div className="chapter-heading"><span className="case-kicker">Aprendizaje activo</span><h2>Tres preguntas para comprender</h2></div><div className="study-cards">{study.map((card, i) => <article key={card.question} className="scientific-study"><h3>{card.question}</h3><button onClick={() => setRevealed(values => values.includes(i) ? values.filter(x => x !== i) : [...values, i])} aria-expanded={revealed.includes(i)}>{revealed.includes(i) ? "Ocultar explicación" : "Explorar la respuesta"}<ArrowRight size={16} /></button><p hidden={!revealed.includes(i)}>{card.answer}</p></article>)}</div></TabsContent>
        <TabsContent value="referencias"><div className="chapter-heading"><span className="case-kicker">Base científica</span><h2>Fuentes para profundizar</h2><p>Literatura veterinaria utilizada para contextualizar y completar esta ficha.</p></div><div className="scientific-references">{content.references.map(reference => <a key={reference.id} href={reference.url} target="_blank" rel="noreferrer"><div><span>{reference.publisher}</span><h3>{reference.title}</h3></div><ArrowUpRight size={21} /></a>)}</div><p className="editorial-note">Las referencias describen conocimiento general y casos publicados. Sus pacientes, tratamientos y resultados no se atribuyen al espécimen del museo. Las observaciones locales se presentan por separado en Anatomía patológica.</p></TabsContent>
      </div>
      {tab !== "galeria" && <aside className="case-sidebar"><div className="case-sidebar-top"><Microscope size={24} strokeWidth={1.25} /><span>Ficha de estudio</span></div><dl><div><dt>Especie</dt><dd>{item.species === "Por determinar" ? "No consignada en el registro" : item.species}</dd></div><div><dt>Sistema y región</dt><dd>{content.system}</dd></div><div><dt>Identificador digital</dt><dd className="case-code">{item.id}</dd></div></dl><div className="sidebar-divider" /><p>La anatomía orienta la pregunta.<br />La evidencia construye la respuesta.</p><Link href="/catalogo">Explorar la colección<ArrowUpRight size={17} /></Link></aside>}
    </div>
    <div className="site-shell case-footer-note">Contenido educativo de patología veterinaria. Las explicaciones bibliográficas y las observaciones del espécimen se mantienen diferenciadas.</div>
  </Tabs>;
}
