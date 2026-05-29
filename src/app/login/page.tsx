"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Label,
  Link,
  TextField,
} from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { userHasAdminRole } from "@/lib/auth/rbac";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const explicitNext = params.get("next");
  const next = explicitNext ?? "/account";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignin = mode === "signin";

  function resetMessages() {
    setError(null);
    setInfo(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    const supabase = createClient();
    if (isSignin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        setError(error.message);
        return;
      }
      if (explicitNext) {
        router.push(explicitNext);
      } else {
        const isAdmin = data.user ? await userHasAdminRole(supabase, data.user.id) : false;
        router.push(isAdmin ? "/admin" : "/account");
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      if (error) setError(error.message);
      else if (data.session) router.push(next);
      else setInfo("Revisa tu correo para confirmar la cuenta.");
    }
  }

  async function onForgotPassword() {
    if (!email) {
      setError("Ingresa tu correo para enviarte el enlace de recuperación.");
      return;
    }
    resetMessages();
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/account`,
    });
    if (error) setError(error.message);
    else setInfo("Te enviamos un enlace para restablecer tu contraseña.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Card.Title>{isSignin ? "Iniciar sesión" : "Crear cuenta"}</Card.Title>
          <Card.Description>
            {isSignin
              ? "Ingresa para gestionar tu suscripción."
              : "Únete para recibir huevos frescos cada semana."}
          </Card.Description>
        </Card.Header>

        <Card.Content>
          <Form onSubmit={onSubmit} className="flex flex-col gap-4">
            <TextField
              name="email"
              type="email"
              isRequired
              value={email}
              onChange={setEmail}
              autoFocus
            >
              <Label>Correo</Label>
              <Input placeholder="tu@correo.com" />
            </TextField>

            <TextField
              name="password"
              type={showPassword ? "text" : "password"}
              isRequired
              value={password}
              onChange={setPassword}
            >
              <Label>Contraseña</Label>
              <div className="relative">
                <Input
                  className="pr-10"
                  placeholder={isSignin ? "••••••••" : "Mínimo 8 caracteres"}
                  minLength={isSignin ? undefined : 8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={() => setShowPassword((s) => !s)}
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <Icon icon={showPassword ? "gravity-ui:eye-slash" : "gravity-ui:eye"} />
                </Button>
              </div>
            </TextField>

            <div className="flex items-center justify-between">
              <Checkbox id="remember" isSelected={remember} onChange={setRemember}>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label htmlFor="remember">Recordarme</Label>
                </Checkbox.Content>
              </Checkbox>
              {isSignin && (
                <Link onPress={onForgotPassword} className="text-sm">
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>

            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            {info && (
              <Alert status="success">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{info}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}

            <Button type="submit" variant="primary" isPending={loading} fullWidth>
              {isSignin ? "Entrar" : "Registrarme"}
            </Button>
          </Form>
        </Card.Content>

        <Card.Footer>
          <p className="text-muted text-sm">
            {isSignin ? "¿Sin cuenta? " : "¿Ya tienes cuenta? "}
            <Link
              onPress={() => {
                setMode(isSignin ? "signup" : "signin");
                resetMessages();
              }}
            >
              {isSignin ? "Crear una" : "Inicia sesión"}
            </Link>
          </p>
        </Card.Footer>
      </Card>
    </main>
  );
}

function LoginFallback() {
  return <main className="bg-background flex min-h-screen items-center justify-center p-4" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
