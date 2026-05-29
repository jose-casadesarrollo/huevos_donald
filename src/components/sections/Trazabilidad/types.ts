export interface TimelineStep {
  label: string;
  time: string;
  status: "done" | "current" | "pending";
}

export interface Lote {
  id: string;
  displayId: { prefix: string; number: string; suffix: string };
  caja: string;
  productor: {
    nombre: string;
    granja: string;
    firmaCorta: string;
  };
  crianza: {
    tipo: string;
    detalle: string;
  };
  alimentacion: {
    tipo: string;
    detalle: string;
  };
  postura: {
    fecha: string;
    relativo: string;
  };
  recorrido: {
    resumen: string;
    detalle: string;
  };
  timeline: TimelineStep[];
}
