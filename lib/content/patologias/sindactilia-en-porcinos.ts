import type { PathologyText } from "../../pathology-text";

const content: PathologyText = {
  "summary": "Voy a transcribir el texto tal como aparece en las imágenes, respetando el orden, sin corregir ni agregar información.",
  "system": "Musculoesquelético",
  "documentSections": [
    {
      "id": "concepto",
      "title": "Descripción de la patología",
      "paragraphs": [
        "Voy a transcribir el texto tal como aparece en las imágenes, respetando el orden, sin corregir ni agregar información."
      ]
    },
    {
      "id": "mecanismo",
      "title": "Origen y desarrollo",
      "paragraphs": [
        "La etiología de las malformaciones congénitas ha sido quizás la dificultad mayor que ha presentado el estudio de la Teratología Veterinaria. En primer lugar por la concepción de los agentes causantes de las mismas en que ha imperado darles mayor importancia a unos en determinado momento. Por muchos años se trató de explicar casi todas las formas de desarrollo fetal deletéreo como originadas por la herencia, esto aun cuando existían evidencias que otros agentes también podían ser su origen. Hoy es más y mejor conocida es la amplitud de los mismos; Agentes Genéticos o hereditarios y agentes Externos o ambientales (contaminación), constituyendo éstos últimos una amplia gama que tiende a incrementarse con algunos adelantos de la ciencia y la tecnología y el deterioro del medio ambiente. Igual importancia se debe prestar por ser una realidad insoluble, la interrelación en que pueden actuar los agentes genéticos y ambientales."
      ]
    },
    {
      "id": "morfologia",
      "title": "Características y observaciones",
      "groups": [
        {
          "title": "Identificación del lechón",
          "fields": [
            { "label": "Especie", "value": "Porcino" },
            { "label": "Raza", "value": "Criollo" },
            { "label": "Edad", "value": "Recién nacido" },
            { "label": "Sexo", "value": "Macho" },
            { "label": "Color", "value": "Blanco" },
            { "label": "Fecha de nacimiento", "value": "21/09/2012" }
          ]
        },
        {
          "title": "Procedencia y registro",
          "fields": [
            { "label": "Nombres consignados", "value": "Fernández Rafael Lorenzo" },
            { "label": "Dirección", "value": "Caserío San Isidro · distrito de Cajamarca · provincia de Cajamarca" }
          ]
        },
        {
          "title": "Antecedentes maternos",
          "fields": [
            { "label": "Raza", "value": "Criollo" },
            { "label": "Número de partos", "value": "01" },
            { "label": "Edad", "value": "1,5 años" },
            { "label": "Color", "value": "Negro" }
          ]
        }
      ],
      "paragraphs": [
        "La sindactilia es una anomalía congénita que se produce por un defecto en la diferenciación del tejido mesenquimatoso durante el periodo embrionario que impide la separación estructural y funcional de las cuñas. La verdadera Sindactilia es la fusión de los huesos y uñas y tejidos blandos que pueden estar asociados con un desarrollo anormal de huesos y uniones musculares, teniendo mayor prevalencia en los machos."
      ]
    }
  ],
  "sections": [
    {
      "id": "concepto",
      "title": "Descripción científica",
      "paragraphs": [
        "Unión de dos o más dedos por diferenciación incompleta de sus estructuras."
      ],
      "referenceIds": [
        "limbs"
      ]
    },
    {
      "id": "mecanismo",
      "title": "Origen y mecanismo",
      "paragraphs": [
        "La fusión puede comprometer tejidos blandos o estructuras óseas; su extensión no se establece solo por la superficie de la pezuña."
      ],
      "referenceIds": [
        "limbs"
      ]
    },
    {
      "id": "morfologia",
      "title": "Características anatomopatológicas",
      "paragraphs": [],
      "points": [
        "Comparar separación digital, simetría y extremidades afectadas."
      ],
      "referenceIds": [
        "limbs"
      ]
    },
    {
      "id": "diagnostico",
      "title": "Enfoque diagnóstico",
      "paragraphs": [],
      "points": [
        "Examen de las extremidades y radiografías para estudiar la participación ósea."
      ],
      "referenceIds": [
        "limbs"
      ]
    },
    {
      "id": "relevancia",
      "title": "Relevancia veterinaria",
      "paragraphs": [
        "Permite relacionar la conformación digital con el apoyo y la locomoción."
      ],
      "referenceIds": [
        "limbs"
      ]
    }
  ],
  "localCases": [],
  "sourceCount": 1
};

export default content;
