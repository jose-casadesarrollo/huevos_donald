import type { Criterion } from "./types";

/**
 * The 5 comparison criteria. Authored as JSX (hence the `.tsx` extension) so
 * the `text` fields can carry semantic inline `<em>` emphasis — the `<em>`
 * is styled (italic / red) at render time by ComparisonRow, never here.
 *
 * Copy is Chilean Spanish and must stay verbatim.
 */
export const criterios: Criterion[] = [
  {
    id: "crianza",
    label: "Crianza",
    left: {
      number: "98%",
      unit: "del mercado",
      text: "Gallinas en jaula",
      note: "600 cm² por gallina. Sin movimiento ni luz solar.",
    },
    right: {
      number: "100%",
      unit: "de nuestros huevos",
      text: (
        <>
          Gallinas <em>free range</em>
        </>
      ),
      note: "2 a 4 m² de pradera por gallina. Salidas diarias al aire libre.",
    },
  },
  {
    id: "trazabilidad",
    label: "Trazabilidad",
    left: {
      number: "0",
      unit: "información del origen",
      text: "Sin productor identificable",
      note: "El cartón no dice quién, dónde, ni cuándo.",
    },
    right: {
      number: "100%",
      unit: "trazables por lote",
      text: (
        <>
          Productor, fecha y ruta <em>visibles</em>
        </>
      ),
      note: "Escaneás el código y conocés todo el recorrido.",
    },
  },
  {
    id: "cadena",
    label: "Cadena",
    left: {
      number: "5+",
      unit: "intermediarios",
      text: "Productor → distribuidor → mayorista → super",
      note: "Cada eslabón agrega días y margen al precio final.",
    },
    right: {
      number: "0",
      unit: "intermediarios",
      text: (
        <>
          Productor → tu casa, <em>directo</em>
        </>
      ),
      note: "Pagás al productor lo que vale, sin cadenas de descuento.",
    },
  },
  {
    id: "frescura",
    label: "Frescura",
    left: {
      number: "15+",
      unit: "días en góndola",
      text: "Fecha de postura no visible",
      note: 'Solo aparece "consumir antes de". Puede tener semanas.',
    },
    right: {
      number: "36h",
      unit: "desde la postura",
      text: (
        <>
          Fecha y hora <em>exactas</em>
        </>
      ),
      note: "Sabés el día y la hora en que los puso la gallina.",
    },
  },
  {
    id: "alimentacion",
    label: "Alimentación",
    left: {
      number: "?",
      numberAriaLabel: "Información no disponible",
      unit: "sin información",
      text: "Antibióticos preventivos comunes",
      note: "Permitidos en producción industrial estándar.",
    },
    right: {
      number: "0",
      unit: "aditivos",
      text: (
        <>
          Granos, pasto y <em>nada más</em>
        </>
      ),
      note: "Sin antibióticos, sin hormonas, sin GMO, sin harinas animales.",
    },
  },
];
