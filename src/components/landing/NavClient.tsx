"use client";

import { Navbar } from "@heroui-pro/react";
import { Button } from "@heroui/react";

type NavClientProps = {
  user: { email: string | null } | null;
  isAdmin: boolean;
};

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
}

function Brand() {
  return (
    <a href="/#top" className="flex items-center text-[15px] font-extrabold tracking-tight">
      <span>HUEVOS</span>
      <span className="mx-1 inline-block size-[6px] rounded-full bg-accent align-middle" />
      <span>DONALD</span>
    </a>
  );
}

export function NavClient({ user, isAdmin }: NavClientProps) {
  const dashboardHref = isAdmin ? "/admin" : "/account";
  const dashboardLabel = isAdmin ? "Admin" : "Mi cuenta";

  return (
    <Navbar position="floating" maxWidth="full" className="!w-1/2 !mx-auto">
      <Navbar.Header>
        <Navbar.Brand>
          <Brand />
        </Navbar.Brand>
        <Navbar.Spacer />
        <Navbar.Content className="hidden md:flex">
          <Navbar.Item href="#como-funciona">Cómo Funciona</Navbar.Item>
          <Navbar.Item href="/planes">Planes</Navbar.Item>
          <Navbar.Item href="#origen">Nosotros</Navbar.Item>
          {user ? (
            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                window.location.href = dashboardHref;
              }}
            >
              {dashboardLabel}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => {
                  window.location.href = "/login";
                }}
              >
                Iniciar sesión
              </Button>
              <Button variant="primary" size="sm" onPress={() => scrollTo("#planes")}>
                Suscribirme
              </Button>
            </>
          )}
        </Navbar.Content>
        <Navbar.MenuToggle className="md:hidden" />
      </Navbar.Header>
      <Navbar.Menu>
        <Navbar.MenuItem href="#como-funciona">Cómo Funciona</Navbar.MenuItem>
        <Navbar.MenuItem href="/planes">Planes</Navbar.MenuItem>
        <Navbar.MenuItem href="#origen">Nosotros</Navbar.MenuItem>
        {user ? (
          <Navbar.MenuItem href={dashboardHref}>{dashboardLabel}</Navbar.MenuItem>
        ) : (
          <>
            <Navbar.MenuItem href="/login">Iniciar sesión</Navbar.MenuItem>
            <Navbar.MenuItem href="#planes">Suscribirme</Navbar.MenuItem>
          </>
        )}
      </Navbar.Menu>
    </Navbar>
  );
}
