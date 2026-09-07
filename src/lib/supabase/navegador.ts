"use client";

import { createBrowserClient } from "@supabase/ssr";

import { credenciales } from "@/lib/supabase/config";

/**
 * Cliente para componentes del navegador. Lo usan el formulario de login y
 * las subidas de archivos a Storage, que van directo del navegador a Supabase
 * sin pasar por el servidor.
 */
export function getSupabaseNavegador() {
  const { url, anonKey } = credenciales();
  return createBrowserClient(url, anonKey);
}
