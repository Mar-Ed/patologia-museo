import type { PathologyText } from "../../pathology-text";

const content: PathologyText = {
  summary: "El leiomioma es una neoplasia benigna de músculo liso. En bovinos se ha descrito en el útero, el cérvix y la vagina; su importancia clínica depende de la localización y del efecto de la masa sobre la función reproductiva.",
  system: "Neoplasia de músculo liso",
  // The reference document describes a different disease, so it supplies no local case findings.
  documentSections: [],
  sections: [
    {
      id: "concepto",
      title: "Descripción científica",
      paragraphs: [
        "El leiomioma es un tumor mesenquimal benigno formado por células con diferenciación de músculo liso. En el tracto genital bovino puede originarse en la pared uterina y también se han publicado casos cervicales y vaginales.",
        "Es una neoplasia poco frecuente en bovinos. Puede detectarse durante la investigación de problemas reproductivos o como un hallazgo incidental en la inspección del aparato genital."
      ],
      referenceIds: ["leiomyomaSurgery", "leiomyomaAtlas"]
    },
    {
      id: "mecanismo",
      title: "Origen y mecanismo",
      paragraphs: [
        "La lesión corresponde a una proliferación neoplásica de células musculares lisas. La etiología del leiomioma uterino bovino no está establecida; no debe atribuirse una causa específica sin evidencia del caso.",
        "Cuando crece hacia la luz uterina, la masa puede ocupar espacio y dificultar la función reproductiva. Su efecto depende de la ubicación y de la obstrucción que produzca."
      ],
      referenceIds: ["leiomyoma", "leiomyomaSurgery"]
    },
    {
      id: "morfologia",
      title: "Características anatomopatológicas",
      paragraphs: [
        "Macroscópicamente puede presentarse como una masa nodular, delimitada y firme. En la pared uterina se han descrito crecimientos solitarios que, por su consistencia, pueden confundirse con un absceso durante la palpación."
      ],
      points: [
        "Registrar el órgano de origen, la ubicación, las dimensiones y la relación de la masa con la luz del órgano.",
        "Evaluar la superficie de corte y la cantidad de tejido conjuntivo, que puede modificar su consistencia.",
        "Microscópicamente se observan haces entrecruzados de células musculares lisas; el estudio del tejido permite clasificar la neoplasia."
      ],
      referenceIds: ["leiomyomaAtlas", "leiomyomaSurgery", "leiomyoma"]
    },
    {
      id: "diagnostico",
      title: "Enfoque diagnóstico",
      paragraphs: [
        "La palpación y la ecografía permiten localizar la masa y valorar su relación con el tracto genital. La apariencia ecográfica orienta la evaluación, pero no confirma por sí sola que se trate de un leiomioma."
      ],
      points: [
        "Correlacionar los hallazgos con los antecedentes reproductivos y la exploración clínica.",
        "Confirmar la naturaleza del tumor mediante biopsia o tejido obtenido durante cirugía o necropsia, seguido de histopatología.",
        "Considerar otras lesiones uterinas y tumores mesenquimales en el diagnóstico diferencial; no clasificar la masa solo por su tamaño.",
        "Valorar la organización celular y el tejido conjuntivo; las tinciones especiales pueden complementar el examen histológico."
      ],
      referenceIds: ["leiomyoma", "leiomyomaSurgery"]
    },
    {
      id: "relevancia",
      title: "Relevancia veterinaria",
      paragraphs: [
        "Un tumor benigno puede tener consecuencias funcionales importantes. Se han documentado leiomiomas uterinos asociados a infertilidad y obstrucción del cuerno uterino en vacas.",
        "En casos publicados se ha realizado extirpación quirúrgica y seguimiento reproductivo. La recuperación descrita en un animal no permite garantizar el mismo resultado en otros: la decisión depende de la localización de la lesión y de la evaluación veterinaria."
      ],
      referenceIds: ["leiomyoma", "leiomyomaSurgery"]
    }
  ],
  localCases: [],
  sourceCount: 1
};

export default content;
