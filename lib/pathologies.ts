export type CategoryId = "desarrollo" | "musculoesqueletica" | "reproductiva" | "adquirida";

export type Pathology = {
  id: string;
  slug: string;
  name: string;
  species: string;
  category: CategoryId;
  summary: string;
  featured?: boolean;
  cover?: string;
  coverThumbnail?: string;
  coverDisplay?: string;
  coverBlur?: string;
  galleryCount?: number;
  documentCount?: number;
};

export const categoryInfo: Record<CategoryId, { name: string; short: string; description: string }> = {
  desarrollo: { name: "Alteraciones del desarrollo", short: "Desarrollo", description: "Cambios originados durante la formación embrionaria o fetal que modifican la anatomía normal." },
  musculoesqueletica: { name: "Alteraciones músculo-esqueléticas", short: "Músculo-esquelética", description: "Anomalías que comprometen huesos, articulaciones, extremidades o musculatura." },
  reproductiva: { name: "Alteraciones reproductivas", short: "Reproductiva", description: "Casos que afectan la diferenciación sexual, los órganos reproductivos o la gestación." },
  adquirida: { name: "Lesiones y enfermedades adquiridas", short: "Adquirida", description: "Procesos inflamatorios, circulatorios, degenerativos o neoplásicos desarrollados después del nacimiento." },
};

const rawPathologies = [
  "WRY NOSE", "VESICULA DOBLE EN CANINO", "TUMOR DE CELULAS ESCAMOSAS, ENUCLEACIÓN DE OJO", "SINDROME DE PRUNE BELLY Y AFASIA", "Síndrome de Prune Belly", "SINDACTILIA EN PORCINOS", "Sindactilia en porcino", "Schistosoma reflexus incompleto en cerdo", "QUISTES FOLICULARES BILATERALES", "Queratomeningocele", "QUEILOSQUISIS-ANQUILOGLOSIA", "PSEUDOHERMAFRODITISMO FEMENINO", "PSEUDOHERMAFRODITISMO EN CERDO", "PSEUDO HERMAFRODITISMO MASCULINO EN BOVINO", "PSEUDO HERMAFRODITISMO EN CAPRINO", "PLEURITIS CRONICA GRANULOMATOSA", "PIE ZAMBO EN CUY", "PALATOSQUISIS Y ESCOLIOSIS EN BOVINO", "MONORQUIDISMO UNILATERAL EN BOVINO", "MOMIFICACIÓN FETAL", "Milagritos", "MICROTIA EN OVINO", "MICROTIA EN OVINO LUCY", "LEIOMIOMA EN VACUNO", "LABIO LEPORINO O QUEILOSQUISIS EN CANINO", "HIPOSPADIA EN OVINO", "HIDRONEFROSIS UNILATERAL EN BOVINO Y PORCINO", "HIDRANENCEFALIA Y CIFOSIS CONGENITA GRAVE EN BOVINO", "HERMAFRODITISMO VERDADERO EN CAPRINO", "HERMAFRODITISMO EN VACUNO", "HENDIDURA DE PALADAR O PALATOSQUISIS EN TERNERO", "HEMOPERICARDIO", "ESCOLIOSIS OVINA II", "ESCOLIOSIS EN OVINO", "DIPROSOPIA PARCIAL EN OVINO", "DIPROSOPIA PARCIAL EN OVINO II", "Diprosopía en caprinos", "Craneotoracópago en ovino", "Craneotoracópago en cuy 2", "Craneotoracópago cuy", "Ciclopia y arrinia canina", "CICLOPIA Y AGNATIA EN CUY", "CICLOPIA FELINA II", "CICLOPIA FELINA", "Caso sindactilia Porcino", "BICEFALIA INCOMPLETA BOVINA", "ARTROGRIPOSIS FELINA", "ATRESIA ANAL Y AMELIA POSTERIOR", "ATRESIA ANAL EN PORCINO", "ARTROGRIPOSIS CONGENITA EN OVINA", "Arrinia porcina", "Anuro en bovino", "ANURO EN ASNO", "ANOTIA EN CONEJO", "Anomalía glosomandibular congénita con hipoplasia mandibular", "Anencefalia y acrania ovino", "AMELIA POSTERIOR TOTAL DE OVINO", "AMELIA PARCIAL ANTERIOR Y ANURO EN VACUNO", "Amelia en ternera", "AGENESIA DE VERTEBRAS COCCÍGEAS",
];

export const normalizeText = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const slugify = (value: string) => normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const displayName = (value: string) => value.toLocaleLowerCase("es").replace(/(^|\s)(\p{L})/gu, (_, lead, letter) => lead + letter.toLocaleUpperCase("es"));

export function speciesOf(name: string) {
  const n = normalizeText(name);
  if (n === "milagritos" || /bovin|vacuno|terner/.test(n)) return "Bovino";
  if (n.includes("canino")) return "Canino";
  if (n.includes("felin")) return "Felino";
  if (/porcin|cerdo/.test(n)) return "Porcino";
  if (/ovino|ovina/.test(n)) return "Ovino";
  if (n.includes("caprino")) return "Caprino";
  if (n.includes("cuy")) return "Cuy";
  if (n.includes("asno")) return "Asno";
  if (n.includes("conejo")) return "Conejo";
  return "Por determinar";
}

export function categoryOf(name: string): CategoryId {
  const n = normalizeText(name);
  if (/tumor|cancer|carcinoma|leucosis|pleuritis|hemopericardio|leiomioma|hidronefrosis/.test(n)) return "adquirida";
  if (/hermafrodit|monorquid|quistes foliculares|momificacion|hipospadia/.test(n)) return "reproductiva";
  if (/escoliosis|sindact|polidact|polimelia|policrus|artrogrip|pie zambo|amelia|vertebras|cifosis/.test(n)) return "musculoesqueletica";
  return "desarrollo";
}

export const pathologies: Pathology[] = rawPathologies.map((raw, index) => {
  const category = categoryOf(raw);
  const name = displayName(raw);
  const featured = normalizeText(raw) === "milagritos";
  return {
    id: `MPV-${String(index + 1).padStart(3, "0")}`,
    slug: slugify(raw),
    name,
    species: speciesOf(raw),
    category,
    featured,
    summary: featured
      ? "Caso emblemático de bicefalia incompleta bovina, conservado para el estudio de la duplicación parcial de estructuras cefálicas."
      : `${categoryInfo[category].description} Registro museográfico asociado a ${name.toLocaleLowerCase("es")}.`,
  };
});

export const findPathology = (slug: string) => pathologies.find((item) => item.slug === slug);
