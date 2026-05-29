"use client";

import { Button } from "@heroui/react";
import { Arrow, Check } from "./icons";

export function CTAFinal() {
  return (
    <section className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-[96rem] rounded-[2.5rem] bg-surface px-6 py-20 text-center shadow-[var(--shadow-card)] md:px-12 md:py-24">
        <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Tu primera caja te está esperando.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted md:text-lg">
          Suscríbete hoy y recibe huevos frescos del sur de Chile esta semana. Sin compromiso,
          cancela cuando quieras.
        </p>

        <div className="mt-10">
          <Button
            variant="primary"
            size="lg"
            onPress={() =>
              document.querySelector("#planes")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="inline-flex items-center gap-2 text-base">
              Elegir mi plan <Arrow />
            </span>
          </Button>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          {["Sin contratos", "Cancela cuando quieras", "Despacho gratis"].map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-accent" />
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
