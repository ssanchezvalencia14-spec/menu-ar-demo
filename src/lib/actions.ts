"use server";

import { revalidatePath } from "next/cache";

import { getSupabase } from "@/lib/supabase";

/** Resultado que consume el formulario de resenas via useActionState. */
export type EstadoResena =
  | { estado: "inicial" }
  | { estado: "ok" }
  | { estado: "error"; mensaje: string };

const LARGO_MAXIMO_COMENTARIO = 500;

/**
 * Deja una resena publica. No hay login: cualquiera que tenga el menu abierto
 * puede calificar, que es justo lo que queremos en una mesa de restaurante.
 *
 * Las mismas reglas estan repetidas en la politica de RLS y en el CHECK de la
 * tabla, asi que aunque alguien saltee este formulario no puede meter basura.
 */
export async function dejarResena(
  _anterior: EstadoResena,
  formData: FormData,
): Promise<EstadoResena> {
  const platoId = String(formData.get("platoId") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const rating = Number(formData.get("rating"));
  const comentarioCrudo = String(formData.get("comentario") ?? "").trim();

  if (!platoId || !slug) {
    return { estado: "error", mensaje: "Faltan datos del plato." };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { estado: "error", mensaje: "Elegi de 1 a 5 estrellas." };
  }

  if (comentarioCrudo.length > LARGO_MAXIMO_COMENTARIO) {
    return {
      estado: "error",
      mensaje: `El comentario no puede pasar de ${LARGO_MAXIMO_COMENTARIO} caracteres.`,
    };
  }

  const { error } = await getSupabase().from("reviews").insert({
    menu_item_id: platoId,
    rating,
    comment: comentarioCrudo || null,
  });

  if (error) {
    return {
      estado: "error",
      mensaje: "No pudimos guardar tu resena. Intenta de nuevo.",
    };
  }

  // Para que el promedio nuevo aparezca en el detalle y en el grid.
  revalidatePath(`/${slug}/plato/${platoId}`);
  revalidatePath(`/${slug}`);

  return { estado: "ok" };
}

/**
 * Registra un toque en "Ver en tu mesa".
 *
 * Se llama sin esperar la respuesta: el AR ya se abrio para cuando esto sale.
 * Si falla, no pasa nada, es una metrica.
 */
export async function registrarVista(platoId: string): Promise<void> {
  if (!platoId) return;

  const { error } = await getSupabase()
    .from("item_views")
    .insert({ menu_item_id: platoId });

  if (error) {
    console.error("No pude registrar la vista:", error.message);
  }
}
