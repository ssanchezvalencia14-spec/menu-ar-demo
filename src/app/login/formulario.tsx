"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Aviso, Campo, Entrada } from "@/components/admin/campos";
import { getSupabaseNavegador } from "@/lib/supabase/navegador";

/**
 * Login del dueno.
 *
 * El alta de la cuenta se hace desde el panel de Supabase, no desde aca: este
 * producto tiene un usuario por restaurante y las altas las das vos al vender.
 * Una pantalla de registro abierta seria una puerta para cualquiera.
 */
export function FormularioDeIngreso() {
  const router = useRouter();
  const parametros = useSearchParams();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ingresar(formData: FormData) {
    setEnviando(true);
    setError(null);

    const supabase = getSupabaseNavegador();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    });

    if (error) {
      setEnviando(false);
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contrasena incorrectos."
          : error.message === "Email not confirmed"
            ? "Tenes que confirmar tu correo antes de entrar. Revisa tu bandeja."
            : "No pudimos iniciar sesion. Intenta de nuevo.",
      );
      return;
    }

    // refresh() para que el middleware vea la cookie nueva antes de navegar.
    router.refresh();
    router.push(parametros.get("volver") ?? "/admin");
  }

  return (
    <form action={ingresar} className="flex w-full flex-col gap-4">
      <Campo etiqueta="Correo">
        <Entrada
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
        />
      </Campo>

      <Campo etiqueta="Contrasena">
        <Entrada
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Campo>

      {error && <Aviso tipo="error">{error}</Aviso>}

      <Button type="submit" size="lg" disabled={enviando} className="w-full">
        {enviando ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
