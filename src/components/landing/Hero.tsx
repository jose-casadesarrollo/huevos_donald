"use client";

import { Button } from "@heroui/react";
import { LoteCarousel } from "@/components/hero/LoteCarousel";
import { Arrow, Pin, Star } from "./icons";

export function Hero() {
  return (
    <section id="top" className="px-4 py-6 md:px-6 md:py-8">
      <div className="relative mx-auto max-w-[96rem] overflow-hidden rounded-[2.5rem] bg-surface px-6 py-16 shadow-[var(--shadow-card)] md:px-12 md:py-20">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_1fr] md:gap-16">
          {/* Left column — copy */}
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Huevos frescos del sur.
              <br />
              En tu puerta.
              <br />
              <span className="text-accent">Cada semana.</span>
            </h1>

            <p className="max-w-xl text-base text-muted md:text-lg">
              Suscríbete y recibe huevos de gallinas de libre pastoreo directo de productores del
              sur de Chile. Sin supermercado, sin intermediarios, sin compromisos.
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
                <Pin className="size-3.5 text-muted" /> Despacho en Santiago
              </span>
            </div>
          </div>

          {/* Right column — traceability carousel */}
          <div className="ml-auto w-full md:-mt-[50px] md:max-w-[calc(100%-100px)]">
            <LoteCarousel />
          </div>
        </div>
      </div>
    </section>
  );
}
