"use client";

import { Button, Card, Chip } from "@heroui/react";
import { Arrow, Calendar, Check, Egg, Pin, Star } from "./icons";

function EggCarton() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[460px] rounded-3xl border border-border bg-surface p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.25)]"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.12em] text-foreground">HUEVOS DONALD</span>
        <span className="text-[11px] font-semibold text-muted">30 UN.</span>
      </div>

      <div className="grid grid-cols-4 gap-3 rounded-2xl bg-surface-secondary p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-full bg-gradient-to-br from-[#fff8e7] to-[#f0e2b9] shadow-inner ring-1 ring-[#e0cf94]/50"
          />
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-background">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-[1.05fr_1fr] md:gap-16 md:py-24">
        {/* Left column — copy */}
        <div className="flex flex-col gap-6">
          <Chip color="accent" variant="soft" size="sm" className="self-start">
            <Chip.Label>
              <span className="inline-flex items-center gap-1.5">
                <Egg className="text-accent" /> Suscripción mensual
              </span>
            </Chip.Label>
          </Chip>

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Huevos frescos del sur.
            <br />
            En tu puerta.
            <br />
            <span className="text-accent">Cada semana.</span>
          </h1>

          <p className="max-w-xl text-base text-muted md:text-lg">
            Suscríbete y recibe huevos de gallinas de libre pastoreo directo de productores del sur
            de Chile. Sin supermercado, sin intermediarios, sin compromisos.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onPress={() => document.querySelector("#planes")?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="inline-flex items-center gap-2">
                Elige tu plan <Arrow />
              </span>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onPress={() =>
                document.querySelector("#como-funciona")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              ¿Cómo funciona?
            </Button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Star className="text-accent" /> +500 suscriptores activos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Pin className="size-3.5 text-muted" /> Despacho en Región de Los Lagos
            </span>
          </div>
        </div>

        {/* Right column — visual */}
        <div className="relative mx-auto w-full max-w-[520px]">
          <EggCarton />

          {/* Float A — top-left badge */}
          <div className="hd-float-a absolute -left-4 top-8 z-10 hidden md:block">
            <Chip color="success" variant="soft" size="md" className="shadow-md">
              <Chip.Label>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex size-4 items-center justify-center rounded-full bg-success text-success-foreground">
                    <Check className="size-2.5" />
                  </span>
                  Libre Pastoreo
                </span>
              </Chip.Label>
            </Chip>
          </div>

          {/* Float B — bottom-right "Próximo despacho" card */}
          <div className="hd-float-b absolute -right-4 bottom-6 z-10 hidden md:block">
            <Card className="w-[240px]">
              <Card.Content className="flex items-center gap-3 px-3 py-2">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Calendar />
                </span>
                <div className="leading-tight">
                  <div className="text-[11px] uppercase tracking-wider text-muted">Próximo despacho</div>
                  <div className="text-sm font-semibold text-foreground">Lunes 15 de junio</div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Float C — middle-right pulsing chip */}
          <div className="hd-float-c absolute -right-6 top-1/2 z-10 hidden -translate-y-1/2 md:block">
            <Chip color="default" variant="primary" size="sm" className="shadow-md">
              <Chip.Label>
                <span className="inline-flex items-center gap-2">
                  <span className="relative inline-flex size-2">
                    <span className="hd-pulse absolute inset-0 rounded-full bg-accent" />
                    <span className="relative inline-flex size-2 rounded-full bg-accent" />
                  </span>
                  Plan Familiar · 30 huevos/sem
                </span>
              </Chip.Label>
            </Chip>
          </div>
        </div>
      </div>
    </section>
  );
}
