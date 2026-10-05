import { normalizeText } from "./pathologies";

export type DocumentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  groups?: { title: string; fields: { label: string; value: string }[] }[];
};
export type SourceText = { name: string; text: string };
const titles: Record<string, string> = { concepto: "Descripción de la patología", mecanismo: "Origen y desarrollo", morfologia: "Características y observaciones", diagnostico: "Evaluación diagnóstica", relevancia: "Relevancia veterinaria" };
const plain = (text: string) => text.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^>]+>/g, "").replace(/[*_#]/g, "").replace(/\\([.()])/g, "$1").replace(/\s+/g, " ").trim();

/** Select substantive paragraphs by topic, without exposing document front matter. */
export function extractDocumentSections(sources: SourceText[], options: { preserveNarrative?: boolean } = {}): DocumentSection[] {
  const sections = Object.entries(titles).map(([id, title]) => ({ id, title, paragraphs: [] as string[] }));
  const seen = new Set<string>();
  for (const source of sources) {
    let topic = "concepto";
    let excluded = false;
    const counts: Record<string, number> = {};
    const lines = source.text.replace(/\r/g, "").split("\n");
    let paragraph: string[] = [];
    const flush = () => {
      const text = plain(paragraph.join(" ")); paragraph = [];
      const key = normalizeText(text);
      if (excluded || text.length < 65 || text.length > 2200 || seen.has(key)) return;
      if (/dedicator|agradec|nuestros queridos padres|este trabajo va dedicado|integrantes|palabras clave|el presente (informe|trabajo)|https?:|data:image|archivo original era formato|por favor.*conviert|\|/.test(key)) return;
      // Curated case narratives can mention the institution and caregivers as clinical history.
      if (!options.preserveNarrative && /docente|universidad nacional|facultad de/.test(key)) return;
      // Keep a readable synthesis from every usable report, not the whole thesis.
      if (!options.preserveNarrative && (counts[topic] ?? 0) >= 4) return;
      counts[topic] = (counts[topic] ?? 0) + 1;
      seen.add(key); sections.find(section => section.id === topic)!.paragraphs.push(text);
    };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const heading = /^#{1,6}\s/.test(line) || (line.length > 0 && /^[-=]{3,}$/.test(lines[i + 1]?.trim() ?? "")) || (/^[A-ZÁÉÍÓÚÑ\d\s.:()–-]+$/.test(line) && line.length > 3 && line.length < 110);
      if (heading) {
        flush();
        const name = normalizeText(plain(line));
        excluded = /dedicator|agradec|bibliograf|referencias|objetiv|indice|integrantes|caratula|anexos|planteamiento|justificacion|materiales/.test(name);
        if (/diagnost|evaluacion|examen|radiograf/.test(name)) topic = "diagnostico";
        else if (/etiolog|causas|mecanismo|patogen|embriolog|desarrollo embrio/.test(name)) topic = "mecanismo";
        else if (/caso|anamnesis|historia|morfolog|caracteristic|signos|sintomas|necropsia|hallazgos|clinica|lesiones/.test(name)) topic = "morfologia";
        else if (/importancia|conclusion|discusion|pronostico|consecuencias/.test(name)) topic = "relevancia";
        else if (/resumen|definicion|introduccion|concepto|marco teorico/.test(name)) topic = "concepto";
        if (/^[-=]{3,}$/.test(lines[i + 1]?.trim() ?? "")) i++;
      } else if (!line) flush();
      else if (!/^[-=]{3,}$/.test(line)) paragraph.push(line);
    }
    flush();
  }
  return sections.filter(section => section.paragraphs.length > 0);
}
