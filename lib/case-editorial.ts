import { normalizeText } from "./pathologies";

export type LocalCase = { title: string; facts: string[] };
type SourceText = { name: string; text: string };

const reviewedCases: Record<string, LocalCase[]> = {
  "arrinia-porcina": [{ title: "Paco · lechón con arrinia", facts: ["Lechón de un día de edad, procedente de Shudal, Cajamarca, perteneciente a una camada de ocho crías.", "El reporte describe ausencia de aberturas nasales y dificultad respiratoria desde el nacimiento.", "Se registra muerte durante el primer día de vida; el mecanismo de muerte no queda confirmado mediante pruebas complementarias."] }],
  "milagritos": [{ title: "Milagritos · duplicación cefálica", facts: ["El reporte identifica un ternero bovino con un solo cuerpo y duplicación parcial de la región cefálica.", "La denominación de bicefalia incompleta procede de la evaluación externa descrita en el caso; no implica duplicación completa de todos los órganos cefálicos."] }],
  "bicefalia-incompleta-bovina": [{ title: "Duplicación cefálica bovina", facts: ["El reporte local identifica al ternero como «Milagritos».", "Se describe un solo cuerpo con desarrollo parcialmente duplicado de las estructuras de la cabeza."] }],
  "hipospadia-en-ovino": [{ title: "Conformación urogenital del ovino", facts: ["El registro fotográfico del reporte describe un ovino de cuatro meses de edad.", "Se documentan un meato en posición anómala, alteración de la conformación prepucial y división del escroto.", "Las comparaciones con anatomía normal del reporte se utilizan como contexto docente, no como fotografías adicionales del mismo animal."] }],
  "hemopericardio": [{ title: "Evaluación cardiovascular bovina", facts: ["El informe describe un bovino adulto de raza criolla evaluado mediante necropsia.", "Se registra contenido sanguinolento en el saco pericárdico y presencia de coágulos alrededor del corazón.", "La causa primaria de la hemorragia no se establece con evidencia concluyente en el material aportado."] }],
  "hermafroditismo-verdadero-en-caprino": [{ title: "Variación del desarrollo sexual caprino", facts: ["Caprino criollo de seis meses y 22 kg, procedente de Pauca Santa Rosa, San Marcos, Cajamarca.", "El reporte describe clitoromegalia, escroto con gónadas de apariencia testicular y persistencia de un tracto mülleriano.", "La denominación histórica «hermafroditismo verdadero» no coincide con la conclusión del reporte, que describe tejido testicular y persistencia uterina. No se documenta confirmación histológica de coexistencia de tejido ovárico y testicular.", "La atribución a un síndrome genético no está confirmada mediante cariotipo o estudio molecular."] }],
  "amelia-posterior-total-de-ovino": [{ title: "Antecedentes del ovino", facts: ["El reporte local registra un nacimiento en Cuyumalca, Chota, en noviembre de 2015.", "Se describe un cordero nacido muerto. La madre había tenido dos partos previos con crías sin malformaciones reportadas.", "No consta identificación del padre, por lo que el antecedente no permite establecer un patrón de herencia."] }],
  "atresia-anal-y-amelia-posterior": [{ title: "Chiri · anomalías congénitas asociadas", facts: ["El reporte describe un ovino nacido en Baños del Inca, Cajamarca, en octubre de 2015.", "Se registra nacimiento vivo y muerte a los dos días, en un caso catalogado con atresia anal y amelia posterior.", "Los partos anteriores de la madre se describen sin anomalías en las crías; ese antecedente no excluye una etiología genética."] }],
  "anencefalia-y-acrania-ovino": [{ title: "Alteración craneoencefálica ovina", facts: ["El apartado clínico describe un feto hembra de raza criolla, de aproximadamente cuatro meses de gestación, procedente de San Marcos, Cajamarca.", "Se refiere ausencia de la bóveda craneal y alteración grave del tejido encefálico.", "El resumen y la historia clínica difieren en la etapa de vida del espécimen; se conserva el dato de la historia clínica sin afirmar una evaluación neonatal confirmada."] }],
  "anotia-en-conejo": [{ title: "Ciclo · alteración auricular", facts: ["Coneja de raza New Zealand, de ocho meses, procedente de Bambamarca, Hualgayoc, Cajamarca.", "El informe registra el caso como anotia; el efecto sobre la audición no puede inferirse solo por la conformación externa."] }],
  "diprosopia-parcial-en-ovino": [{ title: "Lolita · duplicación facial parcial", facts: ["El reporte describe una hembra ovina criolla recién nacida, procedente de Otuzco, La Libertad.", "Se registran duplicación facial, tres lenguas, tres ojos, hendidura labial y palatina, y fusión parcial del hueso occipital.", "La muerte durante el primer día es un antecedente de este caso, no un desenlace universal de todas las duplicaciones faciales."] }],
  "diprosopia-parcial-en-ovino-ii": [{ title: "Reporte de duplicación facial parcial", facts: ["El documento de esta carpeta identifica a una hembra ovina denominada Lolita y reproduce la descripción del reporte de Otuzco.", "La coincidencia documental no permite afirmar que ambas rutas correspondan a especímenes distintos."] }],
  "escoliosis-ovina-ii": [{ title: "Conformación vertebral del ovino", facts: ["El informe describe un ovino macho criollo de aproximadamente tres meses.", "Se registra desviación de la columna, postura irregular y dificultad de desplazamiento.", "No se dispone de evidencia suficiente para establecer la causa primaria de la curvatura."] }],
  "hendidura-de-paladar-o-palatosquisis-en-ternero": [{ title: "Hendidura palatina en ternero Holstein", facts: ["El apartado clínico describe un ternero Holstein de aproximadamente un mes de edad.", "El caso se presenta como hendidura de paladar; la comparación anatómica debe delimitar los segmentos comprometidos."] }],
  "sindactilia-en-porcino": [
    { title: "Reporte neonatal · Cajamarca", facts: ["Un informe describe un lechón macho nacido muerto, procedente de San Isidro, Cajamarca.", "Se registra sindactilia en extremidades anteriores y posteriores. La historia clínica figura como desconocida."] },
    { title: "Reporte de lechón de 17 días · Chota", facts: ["Otro informe describe un lechón de 17 días, de una camada de nueve, procedente de La Pucara, Chota.", "Se refiere fusión digital en las cuatro extremidades y estudio radiográfico comparativo con un hermano.", "Estos dos reportes corresponden a antecedentes diferentes y no se combinan como la historia de un único animal."] },
  ],
};

function plain(value: string) { return value.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_#]/g, "").replace(/\\([.()])/g, "$1").replace(/\s+/g, " ").trim(); }

// Extract short clinical observations, not institutional front matter or theory.
export function extractLocalCases(slug: string, sources: SourceText[]): LocalCase[] {
  const cases: LocalCase[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    const blocks = source.text.split(/\n\s*\n/).map(plain);
    const facts: string[] = [];
    for (const block of blocks) {
      const n = normalizeText(block);
      if (block.length < 65 || /dedicator|agradeci|padres|docente|alumn|propietari|ser humano|humanos|ninos|paciente|sindrome de down|diabetes matern|fuente:|figura|bibliograf|referencias|agradecer|nuestros estudios/.test(n)) continue;
      if (!/se observo|se observaron|se evidencio|se identifico|el animal present|el especimen present|el ternero present|el lechon present|el ovino present|el caprino present/.test(n)) continue;
      const sentences = block.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [];
      const observations = sentences.map(x => x.trim()).filter(sentence => /se observo|se observaron|se evidencio|se identifico|el animal present|el especimen present|el ternero present|el lechon present|el ovino present|el caprino present/.test(normalizeText(sentence)) && sentence.length > 45 && sentence.length < 350 && !/posibl|probabl|sugier|se cree|genet|heredit|causad|normalmente|siempre|confirm|descart|conclu|figura|flecha|posiblemente|aparentemente/i.test(normalizeText(sentence)));
      for (const sentence of observations) {
        const key = normalizeText(sentence);
        if (!seen.has(key)) { seen.add(key); facts.push(sentence); }
      }
      if (facts.length >= 3) break;
    }
    if (facts.length) cases.push({ title: sources.length > 1 ? `Observaciones clínicas · reporte ${cases.length + 1}` : "Observaciones del caso", facts: facts.slice(0, 3) });
  }
  return cases.length ? cases : (reviewedCases[slug] ?? []);
}
