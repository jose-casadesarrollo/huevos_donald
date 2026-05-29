import { KPI, KPIGroup, Rating } from "@heroui-pro/react";
import { Avatar, Card, Chip } from "@heroui/react";

const stats = [
  { val: "500+", label: "Suscriptores activos" },
  { val: "12.000+", label: "Huevos entregados al mes" },
  { val: "15", label: "Productores asociados" },
  { val: "4.9 ★", label: "Calificación promedio" },
];

const testimonials = [
  {
    text:
      "Llevamos 4 meses suscritos. La diferencia de calidad con los huevos del super es brutal. Y ni hablar de la comodidad de que lleguen solos.",
    name: "Familia Pérez-Soto",
    initials: "PS",
    plan: "Plan Familiar · Quincenal",
  },
  {
    text:
      "Tengo una cafetería y cambié de proveedor a Donald. Mis clientes notan la diferencia en los huevos benedictinos. El despacho programado es impecable.",
    name: "Andrés Morales",
    initials: "AM",
    plan: "Plan Negocio · Semanal",
  },
  {
    text:
      "Me encanta el QR en la caja. Mis hijos escanearon y vieron el campo. Eso vale más que cualquier certificación impresa.",
    name: "Carolina Díaz",
    initials: "CD",
    plan: "Plan Esencial · Mensual",
  },
];

export function Social() {
  return (
    <section className="px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-[96rem] rounded-[2.5rem] bg-surface px-6 py-16 shadow-[var(--shadow-card)] md:px-12 md:py-20">
        {/* Stats */}
        <KPIGroup className="grid grid-cols-2 gap-y-6 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <KPI className="flex-1 px-2 text-center md:px-4">
                <KPI.Content>
                  <div className="text-4xl font-extrabold tabular-nums tracking-tight md:text-5xl">
                    {s.val}
                  </div>
                </KPI.Content>
                <KPI.Header>
                  <KPI.Title className="mt-2 block text-sm font-medium text-muted">
                    {s.label}
                  </KPI.Title>
                </KPI.Header>
              </KPI>
              {i < stats.length - 1 && (
                <span aria-hidden className="hidden h-12 w-px bg-separator md:block" />
              )}
            </div>
          ))}
        </KPIGroup>

        {/* Heading */}
        <h2 className="mx-auto mt-20 max-w-2xl text-center text-3xl font-extrabold tracking-tight md:text-5xl">
          Lo que dicen nuestros suscriptores
        </h2>

        {/* Testimonials */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Card key={t.name} className="h-full">
              <Card.Header>
                <div className="-mb-2 text-5xl font-bold leading-none text-accent" aria-hidden>
                  &ldquo;
                </div>
                <Rating value={5} isReadOnly size="sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Rating.Item key={i} value={i + 1} />
                  ))}
                </Rating>
              </Card.Header>
              <Card.Content>
                <p className="text-[15px] leading-relaxed text-foreground">{t.text}</p>
              </Card.Content>
              <Card.Footer>
                <div className="flex items-center gap-3">
                  <Avatar size="md" color="accent" variant="soft">
                    <Avatar.Fallback>{t.initials}</Avatar.Fallback>
                  </Avatar>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">{t.name}</div>
                    <Chip size="sm" variant="soft" color="default" className="mt-1">
                      <Chip.Label>{t.plan}</Chip.Label>
                    </Chip>
                  </div>
                </div>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
