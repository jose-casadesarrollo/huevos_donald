"use client";

import { Stepper } from "@heroui-pro/react";
import { Button } from "@heroui/react";
import { Arrow, Box, Cards, Sliders } from "./icons";

const steps = [
  {
    title: "Elige tu plan",
    description:
      "Selecciona la cantidad de huevos y la frecuencia de despacho que necesitas. Individual, familiar o para tu negocio.",
    icon: <Cards />,
  },
  {
    title: "Recibe en tu puerta",
    description:
      "Cada semana o quincena, tu caja llega fresca a domicilio. Empacada con cuidado, directo desde el campo.",
    icon: <Box />,
  },
  {
    title: "Gestiona cuando quieras",
    description:
      "Pausa, cambia de plan, ajusta tu frecuencia o cancela sin penalidad. Todo desde tu cuenta online.",
    icon: <Sliders />,
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-surface-secondary">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">Así de fácil funciona</h2>
          <p className="mt-4 text-base text-muted md:text-lg">
            En 3 pasos tienes huevos frescos del campo en tu mesa.
          </p>
        </div>

        <div className="mt-14">
          <Stepper orientation="horizontal" size="lg" defaultStep={steps.length}>
            {steps.map((s) => (
              <Stepper.Step key={s.title}>
                <Stepper.Indicator />
                <Stepper.Icon>{s.icon}</Stepper.Icon>
                <Stepper.Title>{s.title}</Stepper.Title>
                <Stepper.Description>{s.description}</Stepper.Description>
                <Stepper.Separator />
              </Stepper.Step>
            ))}
          </Stepper>
        </div>

        <div className="mt-14 text-center">
          <Button
            variant="primary"
            size="lg"
            onPress={() => document.querySelector("#planes")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span className="inline-flex items-center gap-2">
              Empieza ahora <Arrow />
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}
