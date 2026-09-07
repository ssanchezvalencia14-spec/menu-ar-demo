import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la anon key.
 *
 * Esta clave es publica por diseno: viaja al navegador. Lo unico que impide
 * que alguien borre el menu desde la consola son las politicas de RLS de
 * supabase/migrations/0001_init.sql.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true si el proyecto todavia no fue configurado. */
export const supabaseConfigurado = Boolean(url && anonKey);

export function getSupabase() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copia .env.example a .env.local y completa los valores.",
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
