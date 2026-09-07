import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { credenciales } from "@/lib/supabase/config";

/**
 * Dos clientes distintos, a proposito.
 *
 * `getSupabasePublico()` no toca cookies: lo usa el menu del comensal, que
 * nunca esta autenticado. Sin cookies, Next puede tratar esas paginas como
 * cacheables si algun dia hace falta.
 *
 * `getSupabaseSesion()` lee la sesion desde las cookies: lo usa el panel, y
 * es lo que hace que las politicas de RLS vean el `auth.uid()` del dueno.
 */

export function getSupabasePublico() {
  const { url, anonKey } = credenciales();
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

export async function getSupabaseSesion() {
  const { url, anonKey } = credenciales();
  const almacen = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(nuevas) {
        try {
          for (const { name, value, options } of nuevas) {
            almacen.set(name, value, options);
          }
        } catch {
          // Los Server Components no pueden escribir cookies. No es un
          // problema: el middleware ya refresco la sesion antes de llegar aca.
        }
      },
    },
  });
}
