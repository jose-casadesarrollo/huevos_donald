"use client";

// TODO: Wire these link cards to your real documentation, community and
// support URLs. Replace the FAQ entries with real content or fetch them
// from your CMS.

import type {ComponentType} from "react";

import {ArrowRightFromSquare, Book, Comment, LifeRing} from "@gravity-ui/icons";
import {Accordion, Card, Link} from "@heroui/react";

type HelpLink = {
  description: string;
  href: string;
  icon: ComponentType<{className?: string}>;
  title: string;
};

const HELP_LINKS: readonly HelpLink[] = [
  {
    description: "Lee la documentación, guías y referencia de la API para empezar.",
    href: "#",
    icon: Book,
    title: "Documentación",
  },
  {
    description: "Únete a la comunidad para hacer preguntas, compartir tips y conectar con otros usuarios.",
    href: "#",
    icon: Comment,
    title: "Comunidad",
  },
  {
    description: "Obtén ayuda de nuestro equipo de soporte. Respondemos en un día hábil.",
    href: "#",
    icon: LifeRing,
    title: "Contactar a soporte",
  },
];

type FaqItem = {
  question: string;
  answer: string;
};

const FAQS: readonly FaqItem[] = [
  {
    answer:
      "Abre Ajustes > Facturación y haz clic en 'Cambiar plan'. Los cambios se aplican al inicio de tu próximo ciclo de facturación.",
    question: "¿Cómo actualizo mi plan?",
  },
  {
    answer:
      "Sí. En Ajustes > Seguridad activa la autenticación en dos pasos y sigue las instrucciones en pantalla.",
    question: "¿Puedo activar la autenticación en dos pasos?",
  },
  {
    answer:
      "Ve a Ajustes > General y haz clic en 'Eliminar cuenta'. Esta acción es irreversible y borra todos tus datos después de 30 días.",
    question: "¿Cómo elimino mi cuenta?",
  },
  {
    answer:
      "Puedes invitar a nuevos integrantes desde Ajustes > Equipo. Recibirán una invitación por correo con instrucciones para unirse.",
    question: "¿Cómo invito a compañeros de equipo?",
  },
];

export function HelpPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 pb-10 pt-4">
      <p className="text-muted text-sm">
        Encuentra respuestas, contacta a soporte o revisa la documentación.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {HELP_LINKS.map((link) => (
          <HelpLinkCard key={link.title} link={link} />
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground text-base font-semibold">Preguntas frecuentes</h2>
        <Accordion className="w-full">
          {FAQS.map((faq, index) => (
            <Accordion.Item key={faq.question} id={`faq-${index}`}>
              <Accordion.Heading>
                <Accordion.Trigger>
                  {faq.question}
                  <Accordion.Indicator />
                </Accordion.Trigger>
              </Accordion.Heading>
              <Accordion.Panel>
                <Accordion.Body className="text-muted text-sm">{faq.answer}</Accordion.Body>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </section>

      <footer className="text-muted text-xs">
        ¿Sigues con dudas?{" "}
        <Link className="no-underline" href="mailto:soporte@ejemplo.com">
          soporte@ejemplo.com
        </Link>
      </footer>
    </div>
  );
}

function HelpLinkCard({link}: {link: HelpLink}) {
  const Icon = link.icon;

  return (
    <Card className="rounded-2xl">
      <Card.Header>
        <div className="bg-accent-soft text-accent flex size-10 items-center justify-center rounded-xl">
          <Icon className="size-5" />
        </div>
        <Card.Title className="text-base">{link.title}</Card.Title>
        <Card.Description>{link.description}</Card.Description>
      </Card.Header>
      <Card.Footer>
        <Link className="text-accent inline-flex items-center gap-1 text-sm" href={link.href}>
          Abrir
          <ArrowRightFromSquare className="size-3.5" />
        </Link>
      </Card.Footer>
    </Card>
  );
}
