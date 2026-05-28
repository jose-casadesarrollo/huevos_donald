"use client";

import { useState } from "react";
import { Segment } from "@heroui-pro/react";
import { Button, Card, Chip } from "@heroui/react";
import { Check } from "./icons";

type FreqKey = "semanal" | "quincenal" | "mensual";

const PLAN_PRICING: Record<
  FreqKey,
  {
    esencial: { now: number; was: number | null };
    familiar: { now: number; was: number | null };
    negocio: { now: number; was: number | null };
  }
> = {
  semanal:   { esencial: { now: 4690, was: null }, familiar: { now: 10590, was: null }, negocio: { now: 22990, was: null } },
  quincenal: { esencial: { now: 4290, was: null }, familiar: { now:  9690, was: null }, negocio: { now: 21490, was: null } },
  mensual:   { esencial: { now: 3990, was: 4690 }, familiar: { now:  8990, was: 10590 }, negocio: { now: 19990, was: 22990 } },
};

const FREQ_UNIT: Record<FreqKey, string> = {
  semanal: "semana",
  quincenal: "quincena",
  mensual: "mes",
};

const fmt = (n: number) => "$" + n.toLocaleString("es-CL");

type PlanDef = {
  key: "esencial" | "familiar" | "negocio";
  tag: string;
  name: string;
  qty: string;
  qtyFreq: string;
  features: string[];
  ctaLabel: string;
  ctaVariant: "primary" | "outline" | "secondary";
  featured: boolean;
  priceFrom?: boolean;
};

const PLAN_DEFS: PlanDef[] = [
  {
    key: "esencial",
    tag: "Para ti",
    name: "Plan Esencial",
    qty: "12 huevos",
    qtyFreq: "por despacho",
    features: [
      "12 huevos de libre pastoreo",
      "Despacho a domicilio incluido",
      "Origen trazable (QR en caja)",
      "Cambia o cancela cuando quieras",
    ],
    ctaLabel: "Suscribirme",
    ctaVariant: "outline",
    featured: false,
  },
  {
    key: "familiar",
    tag: "El favorito",
    name: "Plan Familiar",
    qty: "30 huevos",
    qtyFreq: "por despacho",
    features: [
      "Todo del Plan Esencial",
      "30 huevos de libre pastoreo",
      "Prioridad de despacho",
      "Recetas exclusivas cada mes",
      "Soporte preferente por WhatsApp",
    ],
    ctaLabel: "Suscribirme",
    ctaVariant: "primary",
    featured: true,
  },
  {
    key: "negocio",
    tag: "Para tu empresa",
    name: "Plan Negocio",
    qty: "90+ huevos",
    qtyFreq: "despacho programado",
    features: [
      "Volumen personalizable",
      "Facturación empresarial",
      "Despacho programado semanal",
      "Account manager dedicado",
      "Precio por volumen",
    ],
    ctaLabel: "Contactar ventas",
    ctaVariant: "secondary",
    featured: false,
    priceFrom: true,
  },
];

export function Pricing() {
  const [freq, setFreq] = useState<FreqKey>("mensual");
  const prices = PLAN_PRICING[freq];
  const unit = FREQ_UNIT[freq];

  return (
    <section id="planes" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">Planes para todos</h2>
          <p className="mt-4 text-base text-muted md:text-lg">
            Sin contratos, sin letra chica. Cancela o pausa cuando quieras.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Segment
            size="md"
            selectedKey={freq}
            onSelectionChange={(k) => setFreq(k as FreqKey)}
          >
            <Segment.Item id="semanal">Semanal</Segment.Item>
            <Segment.Item id="quincenal">Quincenal</Segment.Item>
            <Segment.Item id="mensual">Mensual</Segment.Item>
          </Segment>
          <Chip color="success" variant="soft" size="sm">
            <Chip.Label>Ahorra 15% con mensual</Chip.Label>
          </Chip>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 md:items-stretch">
          {PLAN_DEFS.map((plan) => {
            const p = prices[plan.key];
            return (
              <div key={plan.key} className="relative">
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
                    <Chip color="accent" variant="primary" size="sm">
                      <Chip.Label>Más popular</Chip.Label>
                    </Chip>
                  </div>
                )}
                <Card
                  className={
                    plan.featured
                      ? "h-full border-2 border-accent shadow-[0_30px_60px_-25px_rgba(229,9,20,0.45)]"
                      : "h-full"
                  }
                >
                  <Card.Header>
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      {plan.tag}
                    </div>
                    <Card.Title className="text-2xl font-extrabold">{plan.name}</Card.Title>
                    <Card.Description className="text-sm text-muted">
                      <span className="font-semibold text-foreground">{plan.qty}</span>{" "}
                      <span>· {plan.qtyFreq}</span>
                    </Card.Description>
                  </Card.Header>

                  <Card.Content>
                    <div className="flex flex-wrap items-baseline gap-1">
                      {plan.priceFrom && (
                        <span className="text-sm font-medium text-muted">Desde</span>
                      )}
                      {p.was != null && (
                        <span className="text-base font-medium text-muted line-through">
                          {fmt(p.was)}
                        </span>
                      )}
                      <span className="text-4xl font-extrabold tracking-tight text-foreground">
                        {fmt(p.now)}
                      </span>
                      <span className="text-sm font-medium text-muted">/{unit}</span>
                    </div>

                    <ul className="mt-6 flex flex-col gap-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                            <Check className="size-2.5" />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </Card.Content>

                  <Card.Footer>
                    <Button variant={plan.ctaVariant} size="md" fullWidth>
                      {plan.ctaLabel}
                    </Button>
                  </Card.Footer>
                </Card>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          Todos los planes incluyen despacho gratis en la Región de Los Lagos. Otras regiones consultar.
        </p>
      </div>
    </section>
  );
}
