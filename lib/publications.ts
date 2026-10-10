export type Publication = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  dateLabel: string;
  journal: string;
  type: "Artículo" | "Reporte de caso" | "Nota técnica" | "Revisión";
  topic: string;
  summary: string;
  abstract: string;
  keywords: string[];
  url: string;
};

// Información editorial extraída de Articulos.docx.
// Los resúmenes completos y DOI proceden del documento; las síntesis y etiquetas
// facilitan la consulta. El frontend consume estos datos sin leer Markdown.
export const publications: Publication[] = [
  {
    "id": "PUB-001",
    "title": "Sindactilia en cerdos",
    "url": "https://doi.org/10.5455/ovj.2026.v16.i5.67",
    "abstract": "Un lechón de 17 días de edad y 6,2 kg presentó sindactilia en las cuatro extremidades. Aunque esta anomalía no afectó las actividades diarias del paciente, fue una malformación congénita de relevancia clínica y zootécnica. Se realizó un hemograma completo, mediciones morfométricas y radiografías de las extremidades. Las radiografías revelaron una fusión de los huesos falángicos en las extremidades anteriores y un elemento falángico accesorio ubicado axialmente entre los dedos principales en las extremidades posteriores. El hemograma completo reveló una leucocitosis leve.",
    "dateLabel": "2026",
    "journal": "Open Veterinary Journal",
    "year": 2026,
    "authors": [
      "José Fernández-Vásquez",
      "Samer Sánchez-Silva",
      "Jorge Portal-Torres",
      "Lizbeth Zambrano",
      "Medali Cueva-Rodríguez"
    ],
    "type": "Artículo",
    "topic": "Sistema musculoesquelético",
    "summary": "Evaluación clínica, morfométrica y radiográfica de un lechón con sindactilia en las cuatro extremidades.",
    "keywords": [
      "Porcinos",
      "Sindactilia",
      "Radiografía"
    ]
  },
  {
    "id": "PUB-002",
    "title": "Primer informe de hermafroditismo verdadero en una cabra en Perú",
    "url": "https://doi.org/10.29261/pakvetj/2026.078",
    "abstract": "Los trastornos del desarrollo sexual en animales son afecciones congénitas que conllevan importantes implicaciones genéticas y clínicas. Este estudio describe el caso de una cabra criolla sin cuernos, de seis meses de edad, con hermafroditismo verdadero. El examen clínico reveló un fenotipo ambiguo, caracterizado por la presencia de vulva, clitoromegalia pronunciada (4,5 cm de longitud), escroto y dos testículos en posición normal. La necropsia confirmó la presencia de los testículos junto con un tracto mülleriano completo (útero y vagina). Las gónadas masculinas medían 3,5 y 3,6 cm de longitud (derecha e izquierda, respectivamente). Los ovarios derecho e izquierdo medían 1,6 y 2,5 cm, respectivamente, y no presentaban folículos ni cuerpos lúteos. Se observó piómetra. El análisis hematológico reveló una leucocitosis leve (17,41 × 10³/µL), lo que sugería la existencia de un proceso inflamatorio crónico localizado. Este caso pone de manifiesto la complejidad de este trastorno del desarrollo reproductivo. Un nivel de testosterona en sangre de 0,068 ng/mL confirmó la funcionalidad endocrina de los testículos, mientras que los niveles basales de progesterona (0,566 ng/mL) descartaron la presencia de tejido ovárico cíclico. Se concluyó que se trataba de un caso de hermafroditismo verdadero.",
    "dateLabel": "8 de mayo de 2026",
    "journal": "Pakistan Veterinary Journal",
    "year": 2026,
    "authors": [
      "Paolo Oyarce-Sanchez",
      "Medali Cueva-Rodríguez",
      "Wigoberto Alvarado",
      "Lizbeth Zambrano",
      "Carlos Quilcate Pairazamán",
      "Jorge Portal-Torres"
    ],
    "type": "Artículo",
    "topic": "Desarrollo reproductivo",
    "summary": "Descripción clínica, anatómica y hormonal de una cabra criolla de seis meses con hermafroditismo verdadero.",
    "keywords": [
      "Caprinos",
      "Hermafroditismo",
      "Desarrollo sexual"
    ]
  },
  {
    "id": "PUB-003",
    "title": "Anomalía glosomandibular congénita con hipoplasia mandibular severa en un cerdo. Informe de caso",
    "url": "https://doi.org/10.52973/rcfcv-e362906",
    "abstract": "Las malformaciones congénitas en animales afectan la producción, debido a su impacto en la sobrevivencia neonatal, el bienestar del animal y la eficiencia productiva. Se describe un caso patológico en un cerdo recién nacido, proveniente de una crianza familiar, distrito de Baños del Inca, Cajamarca (Perú). El espécimen fue examinado en el Laboratorio de Patología Veterinaria de la Universidad Nacional de Cajamarca, donde se realizó una evaluación morfológica y radiográfica. Las radiografías laterolateral y dorsoventral evidenciaron una hipoplasia mandibular bilateral severa, con desplazamiento dorsal de la sínfisis y acortamiento simétrico de ambas ramas mandibulares. Los hallazgos fueron compatibles anomalía gloso-mandibular congénita con hipoplasia mandibular severa, contribuyendo al conocimiento de las malformaciones craneofaciales en especies domésticas, enfatizando la importancia del diagnóstico morfológico y radiográfico en neonatos. El presente trabajo tuvo como objetivo describir un caso patológico en un cerdo.",
    "dateLabel": "3 de mayo de 2026",
    "journal": "Revista Científica de la Facultad de Ciencias Veterinarias",
    "year": 2026,
    "authors": [
      "Nayraluz López-Idrogo",
      "Lizbeth Zambrano",
      "Jorge Portal Torres"
    ],
    "type": "Reporte de caso",
    "topic": "Malformaciones craneofaciales",
    "summary": "Evaluación morfológica y radiográfica de un cerdo recién nacido con hipoplasia mandibular bilateral severa en Cajamarca.",
    "keywords": [
      "Porcinos",
      "Hipoplasia mandibular",
      "Radiografía"
    ]
  },
  {
    "id": "PUB-004",
    "title": "Hidranencefalia congénita grave asociada a cifosis torácica en un ternero nacido muerto de Cajamarca, Perú. Informe de caso",
    "url": "https://doi.org/10.47278/journal.ijvs/2026.053",
    "abstract": "La hidranencefalia es una malformación congénita grave caracterizada por la destrucción casi total de los hemisferios cerebrales y su sustitución por líquido cefalorraquídeo dentro de una bóveda craneal intacta. Esta afección se asocia comúnmente a agresiones intrauterinas, tales como infecciones virales, alteraciones vasculares o episodios de hipoxia durante etapas críticas del desarrollo fetal. En este informe se describe el caso de un ternero nacido muerto que presentaba anomalías congénitas graves —incluyendo marcada macrocefalia, cifosis torácica, flexión cervical ventral y rigidez carpiana bilateral—, lo que dio lugar a una distocia. El examen radiográfico post mortem reveló una expansión marcada de la bóveda craneal con radiolucidez intracraneal, una curvatura vertebral compatible con cifosis torácica y signos de compresión torácica y postura anómala. Otros hallazgos de la necropsia incluyeron afectación multisistémica, como hipoplasia pulmonar, hipoplasia renal y anomalías graves del sistema digestivo. A partir de estos hallazgos, se estableció un diagnóstico presuntivo de hidranencefalia congénita grave asociada a cifosis torácica. La coexistencia de anomalías neurológicas, musculoesqueléticas y viscerales sugiere una alteración profunda del desarrollo embrionario temprano. Aunque no fue posible determinar la etiología exacta, no se pueden descartar causas infecciosas, tóxicas, genéticas o vasculares. Este caso pone de relieve la utilidad de la radiografía post mortem como herramienta diagnóstica práctica para evaluar malformaciones congénitas en el ganado bovino, especialmente en entornos con recursos limitados, y contribuye a documentar anomalías del desarrollo poco frecuentes en esta especie.",
    "dateLabel": "1 de mayo de 2026",
    "journal": "Revista Internacional de Ciencias Veterinarias",
    "year": 2026,
    "authors": [
      "Velasquez-Chavez",
      "Chanel Flores-Olano",
      "Jorge Portal-Torres",
      "Giussepe Reyna Cotrina",
      "Medali Cueva-Rodríguez"
    ],
    "type": "Reporte de caso",
    "topic": "Sistema nervioso y desarrollo",
    "summary": "Hallazgos radiográficos y de necropsia en un ternero con diagnóstico presuntivo de hidranencefalia y cifosis torácica.",
    "keywords": [
      "Bovinos",
      "Hidranencefalia",
      "Cifosis"
    ]
  },
  {
    "id": "PUB-005",
    "title": "Pie zambo en cuy (Cavia porcellus). Informe de caso",
    "url": "https://doi.org/10.52973/rcfcv-e361784",
    "abstract": "El pie zambo o talipes equinovarus es una malformación congénita poco frecuente en especies menores como el cuy (Cavia porcellus). Se reporta el caso de un cuy hembra de tres meses de edad que presentó desviación medial en los miembros anteriores, sin compromiso sistémico evidente. Esta condición se asocia a factores intrauterinos mecánicos, defectos neurológicos, alteraciones genéticas o interrupciones en el desarrollo fetal. El hallazgo es relevante debido a la escasez de reportes en cuyes, en contraste con bovinos, ovinos y caninos. Este reporte contribuye a la descripción clínica y discusión etiopatogénica del pie zambo en especies menores, resaltando además el valor del cuy como modelo biomédico para el análisis de malformaciones congénitas.",
    "dateLabel": "22/01/2026",
    "journal": "Revista Científica de la Facultad de Ciencias Veterinarias",
    "year": 2026,
    "authors": [
      "Medali Cueva-Rodríguez",
      "Jorge Portal-Torres",
      "Lizbeth Zambrano"
    ],
    "type": "Reporte de caso",
    "topic": "Sistema musculoesquelético",
    "summary": "Descripción de una hembra de cuy de tres meses con desviación medial de los miembros anteriores y sin compromiso sistémico evidente.",
    "keywords": [
      "Cuyes",
      "Pie zambo",
      "Talipes equinovarus"
    ]
  },
  {
    "id": "PUB-006",
    "title": "Monorquidismo en vacuno (Bos taurus). Informe de caso",
    "url": "https://doi.org/10.52973/rcfcv-e361788",
    "abstract": "El monorquidismo es una alteración definida como la ausencia total de uno de los testículos dada una agenesia testicular. No obstante, dicha ausencia puede estar asociada a una de dos causas: 1) Por lo general esta anomalía está referida a la falta del descenso del testículo desde la cavidad abdominal, es equivalente a la criptorquídea; pero unilateral; 2) Mientras que la agenesia testicular se conoce como anorquídea, también descrita como Síndrome de Regresión Testicular, el cual se puede presentar bi o unilateralmente. Ambas causas enmarcadas dentro de lo que se denomina Síndrome de Disgenesia Testicular. El objetivo del presente trabajo fue identificar una patología en un vacuno. Se reportó un caso de un vacuno de 18 meses de edad de raza Holstein, con un peso 382 kg, se desconoce el historial de sus padres. A la inspección clínica se determinó monorquidismo, puesto que, solo hubo desarrollo de un testículo y no la falla en el descenso. La muestra fue trasladada al Laboratorio de Patología Veterinaria de la Facultad de Ciencias Veterinarias de la Universidad Nacional de Cajamarca. Se apreció la presencia de un solo testículo totalmente desarrollado de 33 cm de circunferencia escrotal. Como resultado de la inspección macroscópica, se determinó que el vacuno tenía un solo testículo. Concluyendo que se trataba de monorquidismo en vacuno.",
    "dateLabel": "11/01/2026",
    "journal": "Revista Científica de la Facultad de Ciencias Veterinarias",
    "year": 2026,
    "authors": [
      "Jorge Portal-Torres",
      "Lizbeth Cristina Zambrano Torrel",
      "Medali Cueva-Rodríguez"
    ],
    "type": "Reporte de caso",
    "topic": "Desarrollo reproductivo",
    "summary": "Evaluación macroscópica de un bovino Holstein de 18 meses con presencia de un solo testículo desarrollado.",
    "keywords": [
      "Bovinos",
      "Monorquidismo",
      "Desarrollo testicular"
    ]
  },
  {
    "id": "PUB-007",
    "title": "Diprosopus y otras malformaciones en bovino. Reporte de caso",
    "url": "https://doi.org/10.52973/rcfcv-e35406",
    "abstract": "El diprosopus es el resultado de una malformación congénita, también conocido como duplicación craneofacial, que es ampliamente reconocido en humanos y también hay reportes en muchas especies animales. El objetivo de esta investigación es conocer sobre las manifestaciones clínicas y hallazgos post mortem en diprosopus en vacuno. Un vacuno hembra con duplicidad incompleta cefálica facial (diprosopus), producto de la octava gestación de una vaca criolla, proveniente del centro poblado de Quidén, distrito de Paccha, provincia de Chota, región de Cajamarca, Perú, con sistema de crianza extensivo de producción. El vacuno presentaba dos maxilares inferiores con doble cavidad oral y nasal, dos lenguas y dientes supernumerarios, la bóveda era doble y cuello único. Se confirma que el caso descrito se trata de diprosopus en dicho vacuno.",
    "dateLabel": "2025",
    "journal": "Revista Científica de la Facultad de Veterinaria",
    "year": 2025,
    "authors": [
      "Gaona-Huamán, E.",
      "Cabrera Rojas, I.",
      "Gálvez-Chuquilín, A.",
      "Portal-Torres, J.",
      "Cueva-Rodríguez, M.",
      "Alvarado, W.",
      "Quilcate-Pairazamán, C."
    ],
    "type": "Reporte de caso",
    "topic": "Malformaciones craneofaciales",
    "summary": "Manifestaciones clínicas y hallazgos post mortem de duplicación craneofacial en un bovino de Chota, Cajamarca.",
    "keywords": [
      "Bovinos",
      "Diprosopus",
      "Duplicación craneofacial"
    ]
  },
  {
    "id": "PUB-008",
    "title": "Meningocele en vacuno (Bos taurus). Nota técnica",
    "url": "https://doi.org/10.52973/rcfcv-e35407",
    "abstract": "Miningocele es la protrusión de las membranas del cerebro o de la médula espinal por un defecto que se genera en el cráneo o en la columna vertebral, como una pequeña bolsa húmeda que sobresale. Las malformaciones en animales pueden darse por causas ambientales, genéticas, agentes infecciosos, ingesta de plantas tóxicas. El objetivo fue identificar una patología en un Vacuno. Se reporta un caso de meningocele en un Vacuno de 4 meses de edad, de sexo macho, en el distrito de Baños del Inca, Cajamarca, el cual fue trasladado al Laboratorio de Patología de la Facultad de Ciencias Veterinarias de la Universidad Nacional de Cajamarca para su revisión del mismo. En la muestra clínica se observó una protuberancia en la parte craneal, la cual presentó líquido cefalorraquídeo. Como resultado a la inspección macroscópica se identificó que era un caso de meningocele en vacuno, por la presencia de una protuberancia en forma de saco en el cerebro, confirmando que la patología fue mingocele en bovino.",
    "dateLabel": "2025",
    "journal": "Revista Científica de la Facultad de Veterinaria",
    "year": 2025,
    "authors": [
      "Cárdenas-Cruz, JM",
      "Membrillo-Vargas, EY",
      "Portal-Torres, J.",
      "Cueva Rodríguez, M."
    ],
    "type": "Nota técnica",
    "topic": "Sistema nervioso",
    "summary": "Descripción de una protuberancia craneal con líquido cefalorraquídeo en un bovino macho de cuatro meses de Baños del Inca.",
    "keywords": [
      "Bovinos",
      "Meningocele",
      "Malformaciones congénitas"
    ]
  },
  {
    "id": "PUB-009",
    "title": "Malformaciones congénitas. Reporte de meromelia, amelia y anuro en terneros",
    "url": "https://doi.org/10.22319/rmcp.v16i4.6762",
    "abstract": "La amelia es una malformación representada por la ausencia de una extremidad o extremidades. Las causas de esta anomalía son multifactoriales, involucrando componentes genéticos, ambientales y epigenéticos. Las mutaciones en genes críticos como Shh (Sonic Hedgehog) y los genes Hox, esenciales para la formación y diferenciación de las extremidades durante el desarrollo embrionario, las interrupciones en Shh y Hox o en su ruta de señalización pueden resultar en amelia. Asimismo, mutaciones en estos genes pueden provocar disrupciones severas en el desarrollo de las extremidades. La amelia se caracteriza anatómicamente por la ausencia completa de una o más extremidades anteriores o posteriores. En cuanto a la meromelia, este tipo de anomalía se trata de la ausencia parcial de una o varias extremidades. Tres casos de bovinos presentaron una malformación en las extremidades anteriores, el primer y tercer caso con anuro. En el examen macroscópico se identificó el primer caso con meromelia y anuro. En el segundo se identificó amelia de las extremidades anteriores derecha e izquierda y el tercer caso con presencia de anuro. Concluyendo que, en los tres casos se presentaron anomalías congénitas.",
    "dateLabel": "18/11/2025",
    "journal": "Revista Mexicana de Ciencias Pecuarias",
    "year": 2025,
    "authors": [
      "Medali Cueva-Rodríguez",
      "Nevil Itamar Pomatanta Escobal",
      "Jorge Portal-Torres",
      "Wigoberto Alvarado C.",
      "Carlos Quilcate-Pairazamán"
    ],
    "type": "Reporte de caso",
    "topic": "Alteraciones del desarrollo",
    "summary": "Reporte de tres casos bovinos con anomalías congénitas que incluyen meromelia, amelia y ausencia de cola.",
    "keywords": [
      "Bovinos",
      "Meromelia",
      "Amelia",
      "Anuro"
    ]
  },
  {
    "id": "PUB-010",
    "title": "Atresia anal en ovino. Informe de caso",
    "url": "https://doi.org/10.52973/rcfcv-e35631",
    "abstract": "Se reporta un caso de un ovino macho de raza criolla de 8 días de edad, donde se evidencia falta de desarrollo de la abertura anal, procedente del centro poblado de Otuzco, Baños del Inca, Cajamarca. Nació el 22 de diciembre de 2014, en la actualidad la muestra se encuentra en el Laboratorio de Patología de la Facultad de Ciencias Veterinarias de la Universidad Nacional de Cajamarca (UNC), donde se realizó la observación fisiopatología del caso, identificando la ausencia del orificio del ano y distención abdominal debido a la incapacidad para evacuar las heces. Se confirma que la malformación descrita es atresia anal, en ovino.",
    "dateLabel": "4 de septiembre de 2025",
    "journal": "Revista Científica de la Facultad de Ciencias Veterinarias",
    "year": 2025,
    "authors": [
      "Jorge Portal-Torres",
      "Juan Rodríguez-Briones",
      "Medali Cueva-Rodríguez"
    ],
    "type": "Reporte de caso",
    "topic": "Sistema digestivo",
    "summary": "Reporte de un cordero criollo de ocho días con ausencia de abertura anal y distensión abdominal, procedente de Otuzco.",
    "keywords": [
      "Ovinos",
      "Atresia anal",
      "Malformaciones congénitas"
    ]
  },
  {
    "id": "PUB-011",
    "title": "Dos casos de craneotoracópago en Cavia porcellus. Reporte de caso",
    "url": "https://doi.org/10.52973/rcfcv-e35630",
    "abstract": "El estudio describe dos casos de craneotoracópago en cuyes de diferentes sexos. El primer caso presenta un cráneo unido, del cual se desprenden dos columnas vertebrales fusionadas desde la región torácica hasta la umbilical, compartiendo la misma caja torácica. El segundo caso se encuentra unido por un solo cráneo desprendiéndose de la parte dorsal dos columnas vertebrales formando dos cuerpos, los cuales están conectados entre sí por la parte ventral desde el cráneo hasta la zona umbilical. En base a ello se confirma que en ambos cuyes se trata de la malformación cranotoracópago.",
    "dateLabel": "23/08/2025",
    "journal": "Revista Científica de la Facultad de Ciencias Veterinarias",
    "year": 2025,
    "authors": [
      "Herman Astonitas-Goicochea",
      "Jorge Portal-Torres",
      "Medali Cueva-Rodríguez"
    ],
    "type": "Reporte de caso",
    "topic": "Alteraciones del desarrollo",
    "summary": "Descripción anatómica de dos casos de cuyes unidos por la región craneal y toracoabdominal.",
    "keywords": [
      "Cuyes",
      "Craneotoracópago",
      "Gemelos unidos"
    ]
  },
  {
    "id": "PUB-012",
    "title": "Un caso de polidactilia en un cerdo de la ciudad de Cajamarca, Perú. Nota técnica",
    "url": "https://doi.org/10.52973/rcfcv-e34405",
    "abstract": "La polidactilia es una condición caracterizada por la presencia de dedos adicionales en las extremidades. El presente trabajo describe un caso de polidactilia en un cerdo. Por observación, examen físico y palpación de los dedos adicionales en la extremidad anterior se determinó que se trataba de polidactilia. Los dedos adicionales estaban completamente formados y tenían una consistencia sólida y flexible durante la palpación. Desde una vista dorsal se observaron cinco dedos con cinco uñas y desde una vista plantar se visualizaron cuatro dedos con sus respectivas uñas. Se destaca la importancia de estudiar las malformaciones en cerdos con el fin de mejorar la comprensión y desarrollar estrategias de manejo y prevención que beneficien tanto a los animales como a la industria porcina en general.",
    "dateLabel": "2024",
    "journal": "Revista Científica de la Facultad de Veterinaria",
    "year": 2024,
    "authors": [
      "Malca-Cobá, SM",
      "Albarrán-Ríos, JW",
      "Portal-Torres, J.",
      "Cueva-Rodríguez, M."
    ],
    "type": "Nota técnica",
    "topic": "Sistema musculoesquelético",
    "summary": "Evaluación física y macroscópica de dedos adicionales en la extremidad anterior de un cerdo de Cajamarca.",
    "keywords": [
      "Porcinos",
      "Polidactilia",
      "Extremidades"
    ]
  },
  {
    "id": "PUB-013",
    "title": "Craneotoracópago en ovinos. Caso clínico",
    "url": "https://doi.org/10.52973/rcfcv-e34414",
    "abstract": "Los gemelos embrionarios monocigóticos se clasifican temprano en el desarrollo según la dirección de las placas embrionarias como toracópagos, isquiópagos, onfalópagos y entre otros. El objetivo del estudio fue determinar una patología en un ovino. Se presenta un caso de anomalía congénita de un ovino de 4 meses de gestación nonato, existiendo predominio del sexo masculino, se trata de gemelos con características inusuales tales como sexo masculino en ambos ovinos. Se dio como resultado, la conformación del feto aparentemente normal: cráneo aparentemente normal, dos orbitas oculares, dos pabellones auriculares, una cavidad nasal y oral, a la vez se observó que a la altura del tórax la unión de ambos cuerpos, (toracoabdominal) con un solo ombligo, 4 miembros posteriores, 2 anteriores, ambos del mismo sexo. En conclusión, se determinó que la patología es craneotoracópago en ovino.",
    "dateLabel": "2024",
    "journal": "Revista Científica de la Facultad de Veterinaria",
    "year": 2024,
    "authors": [
      "Cercado, DLI",
      "Rayco, JEC",
      "Portal-Torres, J.",
      "Cueva-Rodríguez, M.",
      "Guevara-Cruzado, E."
    ],
    "type": "Reporte de caso",
    "topic": "Alteraciones del desarrollo",
    "summary": "Descripción anatómica de gemelos ovinos unidos en un caso de craneotoracópago de cuatro meses de gestación.",
    "keywords": [
      "Ovinos",
      "Craneotoracópago",
      "Gemelos unidos"
    ]
  },
  {
    "id": "PUB-014",
    "title": "Palatosquisis en un ternero raza Holstein. Caso clínico",
    "url": "https://doi.org/10.52973/rcfcv-e34409",
    "abstract": "La palatosquisis es un teratoma hereditario que se presenta en bovinos, es una anomalía hereditaria que afecta la cavidad oral debido a un mal cierre durante el desarrollo embrionario, esta malformación puede tener un impacto negativo en el animal, afectando su alimentación y generando problemas como la regurgitación y rinitis. Se reporta el caso de un bovino hembra de 2 meses de edad que presentaba una malformación específicamente en el paladar duro. Se observó que la ternera presentaba palatosquisis, manifestó dificultad para alimentarse, así como rinitis, cuadros que se derivaron de la anomalía descrita.",
    "dateLabel": "2024",
    "journal": "Revista Científica de la Facultad de Veterinaria",
    "year": 2024,
    "authors": [
      "Centellas-Jáuregui, RV",
      "Portal-Torres, J.",
      "Cueva-Rodríguez, M.",
      "Alvarado, W.",
      "Quilcate-Pairazamán, C."
    ],
    "type": "Reporte de caso",
    "topic": "Malformaciones craneofaciales",
    "summary": "Reporte de una ternera Holstein de dos meses con una malformación del paladar duro, dificultad para alimentarse y rinitis.",
    "keywords": [
      "Bovinos",
      "Palatosquisis",
      "Paladar hendido"
    ]
  }
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

export function filterPublications(items: Publication[], query: string, year: string, type: string) {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  return items.filter(publication => {
    const searchable = normalize([publication.title, ...publication.authors, publication.journal, publication.topic, publication.summary, ...publication.keywords].join(" "));
    return (!year || String(publication.year) === year) && (!type || publication.type === type) && terms.every(term => searchable.includes(term));
  }).sort((a, b) => b.year - a.year || a.id.localeCompare(b.id));
}
