import { ItemCard } from "@heroui-pro/react";
import { Chip, Link } from "@heroui/react";
import { Arrow, Handshake, Leaf, Pin } from "./icons";

export function Origin() {
  return (
    <section id="origen" data-theme="dark" className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1.05fr] md:gap-16">
          {/* Photo collage — placeholder backgrounds until real photos */}
          <div aria-hidden className="relative h-[420px] w-full md:h-[480px]">
            <div
              className="absolute left-0 top-0 h-[72%] w-[68%] rounded-3xl bg-gradient-to-br from-[#3a2f1f] via-[#5b4624] to-[#8a6a2f] shadow-2xl"
            />
            <div
              className="absolute bottom-0 right-0 h-[55%] w-[55%] rounded-3xl bg-gradient-to-br from-[#1b2a18] via-[#2d4422] to-[#54703a] shadow-2xl ring-4 ring-background"
            />
            <div
              className="absolute right-4 top-6 h-[35%] w-[38%] rounded-2xl bg-gradient-to-br from-[#6b4a1f] via-[#9b7a36] to-[#d6b366] shadow-xl ring-4 ring-background"
            />
          </div>

          {/* Right column — copy */}
          <div className="flex flex-col gap-6">
            <Chip color="accent" variant="soft" size="sm" className="self-start">
              <Chip.Label>Nuestro origen</Chip.Label>
            </Chip>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Cada huevo tiene nombre,{" "}
              <em className="not-italic text-accent">campo y coordenadas.</em>
            </h2>

            <p className="max-w-xl text-base text-muted md:text-lg">
              En el sur de Chile, entre lagos y volcanes, hay familias que crían gallinas como se
              hacía antes. Al aire libre, comiendo lo que la tierra da. Huevos Donald conecta esos
              campos con tu suscripción. Sin cadenas de supermercado, sin bodegas frías, sin semanas
              de espera.
            </p>

            <div className="mt-2 flex flex-col gap-3">
              <ItemCard variant="transparent">
                <ItemCard.Icon>
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Pin />
                  </span>
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Trazabilidad por QR</ItemCard.Title>
                  <ItemCard.Description>
                    Escanea y conoce el campo de origen.
                  </ItemCard.Description>
                </ItemCard.Content>
              </ItemCard>

              <ItemCard variant="transparent">
                <ItemCard.Icon>
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Leaf />
                  </span>
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Libre pastoreo certificable</ItemCard.Title>
                  <ItemCard.Description>
                    Gallinas en pradera, no en jaula.
                  </ItemCard.Description>
                </ItemCard.Content>
              </ItemCard>

              <ItemCard variant="transparent">
                <ItemCard.Icon>
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Handshake />
                  </span>
                </ItemCard.Icon>
                <ItemCard.Content>
                  <ItemCard.Title>Comercio directo</ItemCard.Title>
                  <ItemCard.Description>Precio justo para el productor.</ItemCard.Description>
                </ItemCard.Content>
              </ItemCard>
            </div>

            <Link href="#" className="mt-2 inline-flex items-center gap-1.5 self-start text-accent">
              Conoce a nuestros productores
              <Arrow />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
