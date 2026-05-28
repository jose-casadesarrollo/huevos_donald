"use client";

import { useEffect, useState } from "react";
import { Button, Chip, Popover } from "@heroui/react";
import { Arrow, WhatsApp } from "./icons";

const PHONE = "56900000000";
const SUBSCRIBE_MSG = encodeURIComponent("Hola Huevos Donald, quiero suscribirme a un plan.");
const DOUBT_MSG = encodeURIComponent("Hola Huevos Donald, tengo una duda.");

export function WhatsAppWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover>
        <Popover.Trigger>
          <Button
            isIconOnly
            size="lg"
            aria-label="Contactar por WhatsApp"
            className="relative size-14 rounded-full bg-[#25D366] text-white shadow-2xl hover:bg-[#1ebf57]"
          >
            <WhatsApp className="size-7" />
            <span
              aria-hidden
              className="absolute -right-1 -top-1 inline-flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow"
            >
              1
            </span>
          </Button>
        </Popover.Trigger>

        <Popover.Content className="w-[300px] p-4">
          <div>
            <h4 className="text-base font-semibold">¿Dudas sobre tu suscripción?</h4>
            <p className="mt-1 text-sm text-muted">Te respondemos en minutos.</p>
            <div className="mt-4 flex flex-col gap-2">
              <a
                href={`https://wa.me/${PHONE}?text=${SUBSCRIBE_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Chip color="default" variant="soft" size="md" className="w-full justify-between">
                  <Chip.Label>
                    <span className="inline-flex items-center gap-2">
                      Quiero suscribirme
                      <Arrow className="size-3.5 text-[#25D366]" />
                    </span>
                  </Chip.Label>
                </Chip>
              </a>
              <a
                href={`https://wa.me/${PHONE}?text=${DOUBT_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Chip color="default" variant="soft" size="md" className="w-full justify-between">
                  <Chip.Label>
                    <span className="inline-flex items-center gap-2">
                      Tengo una duda
                      <Arrow className="size-3.5 text-[#25D366]" />
                    </span>
                  </Chip.Label>
                </Chip>
              </a>
            </div>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
}
