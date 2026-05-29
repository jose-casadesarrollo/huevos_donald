import type { Lote } from "./types";

export const loteEjemplo: Lote = {
  id: "DN-2417-SE",
  displayId: { prefix: "DN", number: "2417", suffix: "SE" },
  caja: "Caja de 12 huevos · Calibre L · Color marrón",
  productor: {
    nombre: "Don Manuel Henríquez",
    granja: "Granja San Esteban · Valle del Aconcagua",
    firmaCorta: "M. Henríquez",
  },
  crianza: {
    tipo: "Free range certificado",
    detalle: "Certified Humane® · 4 m² por gallina",
  },
  alimentacion: {
    tipo: "Granos + pastoreo",
    detalle: "100% vegetariana · Sin GMO · Sin antibióticos",
  },
  postura: {
    fecha: "Viernes 29.05 — 06:42",
    relativo: "Hace 18 horas · Lote del día",
  },
  recorrido: {
    resumen: "87 km — San Esteban → Santiago",
    detalle: "Vehículo refrigerado · Cadena de frío continua",
  },
  timeline: [
    { label: "Postura", time: "VIE 06:42", status: "done" },
    { label: "Inspección", time: "VIE 09:15", status: "done" },
    { label: "En camino", time: "VIE 11:20", status: "current" },
    { label: "Tu casa", time: "~14:30", status: "pending" },
  ],
};
