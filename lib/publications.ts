export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: "Artículo" | "Reporte de caso" | "Revisión";
  topic: string;
  summary: string;
  abstract: string;
  keywords: string[];
  isDemo: boolean;
  url?: string;
};

// Datos ficticios para previsualizar la sección. Para añadir un trabajo real,
// sustituye los datos, cambia isDemo a false y añade su enlace HTTPS en url.
// No se atribuyen autores, resultados ni aprobaciones reales a estos ejemplos.
export const publications: Publication[] = [
  {
    id: "PUB-DEMO-001",
    title: "Malformaciones congénitas bovinas: una mirada anatomopatológica",
    authors: ["Autor de ejemplo A", "Autor de ejemplo B"],
    year: 2026,
    type: "Revisión",
    topic: "Alteraciones del desarrollo",
    summary: "Ejemplo de una revisión dedicada a la observación y clasificación de alteraciones congénitas en bovinos.",
    abstract: "Este resumen ficticio muestra cómo se organizaría la presentación de una revisión científica: contexto del tema, propósito del trabajo, fuentes consultadas y conclusiones. El contenido definitivo se reemplazará por el resumen de una publicación real; no se presentan resultados de investigación.",
    keywords: ["Bovinos", "Desarrollo embrionario", "Teratología"],
    isDemo: true,
  },
  {
    id: "PUB-DEMO-002",
    title: "Lesiones oculares en animales domésticos: descripción morfológica",
    authors: ["Autor de ejemplo C"],
    year: 2026,
    type: "Artículo",
    topic: "Anatomía patológica",
    summary: "Una muestra de la ficha editorial para un artículo sobre el registro y la descripción de lesiones oculares.",
    abstract: "Texto de demostración para visualizar un artículo científico dentro de la biblioteca. Aquí se incluirían los objetivos, la metodología, los hallazgos y las conclusiones que figuren en el documento original. Este ejemplo no corresponde a un estudio publicado ni a pacientes del museo.",
    keywords: ["Lesiones oculares", "Morfología", "Histopatología"],
    isDemo: true,
  },
  {
    id: "PUB-DEMO-003",
    title: "Alteraciones del desarrollo vertebral en ovinos",
    authors: ["Autor de ejemplo D", "Autor de ejemplo E"],
    year: 2025,
    type: "Reporte de caso",
    topic: "Sistema musculoesquelético",
    summary: "Ejemplo de presentación de un reporte de caso centrado en la evaluación anatómica de la columna vertebral.",
    abstract: "Resumen ficticio de un reporte de caso. La versión real contendría antecedentes, descripción clínica, métodos de evaluación y discusión, diferenciando los hallazgos del paciente del conocimiento bibliográfico. No se han inventado observaciones clínicas ni resultados para este ejemplo.",
    keywords: ["Ovinos", "Columna vertebral", "Escoliosis"],
    isDemo: true,
  },
  {
    id: "PUB-DEMO-004",
    title: "La colección anatomopatológica como recurso para la enseñanza",
    authors: ["Autor de ejemplo F"],
    year: 2025,
    type: "Artículo",
    topic: "Educación veterinaria",
    summary: "Una publicación de muestra sobre la integración de especímenes y registros documentales en el aprendizaje veterinario.",
    abstract: "Este texto ilustra el espacio destinado al resumen de una publicación sobre docencia. Permitirá mostrar su propósito, enfoque y aportaciones sin cargar el documento completo. Los autores, el año y el contenido son datos de prueba y no representan un trabajo aprobado por la facultad.",
    keywords: ["Docencia", "Museo", "Aprendizaje"],
    isDemo: true,
  },
  {
    id: "PUB-DEMO-005",
    title: "Documentación de anomalías del aparato urinario en bovinos",
    authors: ["Autor de ejemplo G", "Autor de ejemplo H"],
    year: 2024,
    type: "Reporte de caso",
    topic: "Sistema urinario",
    summary: "Ejemplo de un registro bibliográfico dedicado a la descripción de una alteración anatómica del sistema urinario.",
    abstract: "Contenido ficticio para probar la organización de un reporte de caso en la sección. En una publicación real, este apartado recogería exclusivamente la información confirmada por sus autores. No se asignan diagnósticos, procedimientos ni desenlaces a un espécimen de la colección.",
    keywords: ["Bovinos", "Riñón", "Hidronefrosis"],
    isDemo: true,
  },
  {
    id: "PUB-DEMO-006",
    title: "Archivo digital y conservación de la memoria científica veterinaria",
    authors: ["Autor de ejemplo I"],
    year: 2024,
    type: "Revisión",
    topic: "Documentación científica",
    summary: "Una muestra de revisión sobre el acceso, la organización y la conservación de documentos académicos.",
    abstract: "Resumen de ejemplo para visualizar una revisión sobre documentación científica. Cuando se incorpore un trabajo real, se añadirán sus autores, datos bibliográficos y enlace autorizado. Este registro no tiene DOI, revista ni documento de descarga porque es únicamente una demostración.",
    keywords: ["Archivo digital", "Publicaciones", "Conservación"],
    isDemo: true,
  },
];

export const hasRealPublications = publications.some(publication => !publication.isDemo);

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function filterPublications(items: Publication[], query: string, year: string, type: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return items.filter(publication => {
    const searchable = normalize([publication.title, ...publication.authors, publication.topic, publication.summary, ...publication.keywords].join(" "));
    return (!year || String(publication.year) === year) && (!type || publication.type === type) && terms.every(term => searchable.includes(term));
  }).sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
}
