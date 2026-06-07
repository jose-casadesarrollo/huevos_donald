"use client";

import { Accordion, Link } from "@heroui/react";
import { Arrow } from "./icons";

const items = [
  {
    q: "¿Cómo funciona la suscripción?",
    a: "Eliges un plan, seleccionas la frecuencia de despacho y listo. Cada semana, quincena o mes recibes huevos frescos en tu puerta. Sin contratos de permanencia.",
  },
  {
    q: "¿Puedo pausar o cancelar mi suscripción?",
    a: "Sí, cuando quieras desde tu panel de suscriptor, sin penalización. Durante la pausa no se generan cobros ni despachos y tu saldo de huevos se conserva. Al reactivar recuperas tu saldo y tus puntos; si cancelas, no se afectan los despachos ya pagados en preparación y los puntos acumulados caducan.",
  },
  {
    q: "¿Dónde hacen despacho?",
    a: "Despachamos en 7 comunas de Santiago: Lo Barnechea, Las Condes, Vitacura, Providencia, La Reina, Ñuñoa y Peñalolén. Estamos ampliando cobertura — déjanos tu comuna y te avisamos cuando lleguemos.",
  },
  {
    q: "¿Cuáles son los horarios de despacho?",
    a: "Despachamos de lunes a jueves de 10:00 a 17:00 y los viernes de 10:00 a 13:00. No hay despachos los sábados, domingos ni feriados (salvo campañas especiales, que te avisaríamos con anticipación).",
  },
  {
    q: "¿Qué tipo de huevos son?",
    a: "Huevos de gallinas de libre pastoreo, criadas por productores minoristas del sur de Chile. No son industriales, no son de jaula. Cada caja tiene un QR con los datos del campo de origen.",
  },
  {
    q: "¿Cuánto demora el despacho?",
    a: "Los huevos se recolectan y despachan en un máximo de 48 horas. Recibes producto que tiene días, no semanas, desde la postura.",
  },
  {
    q: "¿Y si llegan huevos quebrados o dañados?",
    a: "Avísanos dentro de las 24 horas siguientes a la entrega con una foto. Lo resolvemos con reposición (parcial o total) o un cupón de descuento. En incidentes de producto no hacemos devolución de dinero.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Tarjeta de crédito/débito, transferencia bancaria y MercadoPago. El cobro es automático según tu frecuencia de suscripción.",
  },
  {
    q: "¿Puedo cambiar de plan?",
    a: "Sí, puedes subir o bajar de plan en cualquier momento. El cambio aplica desde tu próximo despacho.",
  },
  {
    q: "¿Hacen descuento por volumen o para empresas?",
    a: "Sí. El plan más grande tiene precios por volumen y facturación empresarial. Contáctanos por WhatsApp para una cotización personalizada.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-[96rem] px-6 py-16 md:px-12 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-16">
          {/* Sticky left column */}
          <div className="md:sticky md:top-24 md:self-start">
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-base text-muted md:text-lg">
              Todo lo que necesitas saber antes de suscribirte.
            </p>
            <Link href="#" className="mt-6 inline-flex items-center gap-1.5 text-accent">
              ¿Otra duda? Escríbenos por WhatsApp
              <Arrow />
            </Link>
          </div>

          {/* Accordion */}
          <Accordion variant="surface" defaultExpandedKeys={new Set(["0"])}>
            {items.map((it, i) => (
              <Accordion.Item key={String(i)} id={String(i)}>
                <Accordion.Heading>
                  <Accordion.Trigger>
                    <span>{it.q}</span>
                    <Accordion.Indicator />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>
                    <p className="text-[15px] leading-relaxed text-muted">{it.a}</p>
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
