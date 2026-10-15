import "server-only";

import { redirect } from "next/navigation";

import { normalizarHorarios } from "@/lib/horarios";
import { normalizarTema, type Tema } from "@/lib/tema";
import { getSupabaseSesion } from "@/lib/supabase/servidor";
import type { CategoryRow, MenuItemRow, RestaurantRow } from "@/types/database";
import type { Horarios } from "@/types/menu";

/**
 * Lectura para el panel.
 *
 * A diferencia del menu publico, aca se ve TODO: platos pausados y categorias
 * vacias incluidas. Es el inventario del dueno, no la carta del comensal.
 *
 * Todas las consultas usan el cliente con sesion, asi que las politicas de RLS
 * ven el auth.uid() y filtran solo. No hace falta agregar `where owner = ...`
 * a mano: si alguien manipulara un id, la base devuelve vacio igual.
 */

export interface RestauranteAdmin {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  logo: string | null;
  direccion: string | null;
  horarios: Horarios;
  /** Apariencia del menu publico. Se edita en /admin/apariencia. */
  tema: Tema;
  zonaHoraria: string;
  moneda: string;
  locale: string;
}

export interface CategoriaAdmin {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
  cantidadDePlatos: number;
}

export interface PlatoAdmin {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  modeloGlb: string | null;
  modeloUsdz: string | null;
  esEspecialidad: boolean;
  disponible: boolean;
  orden: number;
  categoriaId: string;
  categoriaNombre: string;
}

/** El usuario de la sesion, o redirige al login. */
export async function exigirSesion() {
  const supabase = await getSupabaseSesion();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * El restaurante del usuario logueado. `null` si todavia no tiene ninguno,
 * que es lo que dispara la pantalla de bienvenida.
 */
export async function getRestauranteDelDueno(): Promise<RestauranteAdmin | null> {
  const { supabase, user } = await exigirSesion();

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const fila = data as RestaurantRow;
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.name,
    descripcion: fila.description ?? "",
    logo: fila.logo_url,
    direccion: fila.address,
    horarios: normalizarHorarios(fila.hours),
    tema: normalizarTema(fila.tema),
    zonaHoraria: fila.timezone,
    moneda: fila.currency,
    locale: fila.locale,
  };
}

/** Igual que la anterior pero manda a la bienvenida si no hay restaurante. */
export async function exigirRestaurante(): Promise<RestauranteAdmin> {
  const restaurante = await getRestauranteDelDueno();
  if (!restaurante) redirect("/admin/bienvenida");
  return restaurante;
}

export async function getCategoriasAdmin(
  restauranteId: string,
): Promise<CategoriaAdmin[]> {
  const { supabase } = await exigirSesion();

  const { data, error } = await supabase
    .from("categories")
    .select("*, menu_items(id)")
    .eq("restaurant_id", restauranteId)
    .order("sort_order");

  if (error || !data) return [];

  return (data as (CategoryRow & { menu_items: { id: string }[] })[]).map(
    (fila) => ({
      id: fila.id,
      nombre: fila.name,
      icono: fila.icon,
      orden: fila.sort_order,
      cantidadDePlatos: fila.menu_items.length,
    }),
  );
}

export async function getPlatosAdmin(
  restauranteId: string,
): Promise<PlatoAdmin[]> {
  const { supabase } = await exigirSesion();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(id, name, sort_order)")
    .eq("restaurant_id", restauranteId);

  if (error || !data) return [];

  const filas = data as (MenuItemRow & {
    categories: { id: string; name: string; sort_order: number };
  })[];

  return filas
    .sort(
      (a, b) =>
        a.categories.sort_order - b.categories.sort_order ||
        a.sort_order - b.sort_order,
    )
    .map((fila) => ({
      id: fila.id,
      nombre: fila.name,
      descripcion: fila.description ?? "",
      precio: fila.price,
      imagen: fila.image_url,
      modeloGlb: fila.model_glb_url,
      modeloUsdz: fila.model_usdz_url,
      esEspecialidad: fila.is_specialty,
      disponible: fila.is_available,
      orden: fila.sort_order,
      categoriaId: fila.categories.id,
      categoriaNombre: fila.categories.name,
    }));
}

export async function getPlatoAdmin(id: string): Promise<PlatoAdmin | null> {
  const { supabase } = await exigirSesion();

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, categories(id, name, sort_order)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const fila = data as MenuItemRow & {
    categories: { id: string; name: string; sort_order: number };
  };

  return {
    id: fila.id,
    nombre: fila.name,
    descripcion: fila.description ?? "",
    precio: fila.price,
    imagen: fila.image_url,
    modeloGlb: fila.model_glb_url,
    modeloUsdz: fila.model_usdz_url,
    esEspecialidad: fila.is_specialty,
    disponible: fila.is_available,
    orden: fila.sort_order,
    categoriaId: fila.categories.id,
    categoriaNombre: fila.categories.name,
  };
}

export interface ResumenDelPanel {
  platosActivos: number;
  platosPausados: number;
  categorias: number;
  promedioGeneral: number;
  totalResenas: number;
}

/** Numeros del dashboard. */
export async function getResumen(
  restauranteId: string,
): Promise<ResumenDelPanel> {
  const { supabase } = await exigirSesion();

  const [platos, categorias, resenas] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, is_available")
      .eq("restaurant_id", restauranteId),
    supabase
      .from("categories")
      .select("id")
      .eq("restaurant_id", restauranteId),
    supabase
      .from("menu_items")
      .select("reviews(rating)")
      .eq("restaurant_id", restauranteId),
  ]);

  const filasDePlatos = (platos.data ?? []) as { is_available: boolean }[];
  const calificaciones = ((resenas.data ?? []) as { reviews: { rating: number }[] }[])
    .flatMap((fila) => fila.reviews ?? [])
    .map((r) => r.rating);

  const suma = calificaciones.reduce((total, valor) => total + valor, 0);

  return {
    platosActivos: filasDePlatos.filter((p) => p.is_available).length,
    platosPausados: filasDePlatos.filter((p) => !p.is_available).length,
    categorias: (categorias.data ?? []).length,
    promedioGeneral: calificaciones.length
      ? Math.round((suma / calificaciones.length) * 10) / 10
      : 0,
    totalResenas: calificaciones.length,
  };
}

export interface OpinionAdmin {
  id: string;
  calificacion: number;
  comentario: string | null;
  fecha: string;
  platoId: string;
  platoNombre: string;
}

/**
 * Tope de opiniones que trae la pantalla. Alcanza para meses de un restaurante
 * normal; si algun dia no alcanza, hace falta paginar.
 */
export const MAXIMO_DE_OPINIONES = 500;

/**
 * Las resenas del restaurante, las mas nuevas primero, con su comentario.
 *
 * El `!inner` hace que el filtro por restaurante descarte la resena entera y
 * no solo el plato anidado. Incluye platos pausados: el dueno ve todo.
 */
export async function getOpiniones(
  restauranteId: string,
): Promise<OpinionAdmin[]> {
  const { supabase } = await exigirSesion();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, rating, comment, created_at, menu_items!inner(id, name, restaurant_id)",
    )
    .eq("menu_items.restaurant_id", restauranteId)
    .order("created_at", { ascending: false })
    .limit(MAXIMO_DE_OPINIONES);

  if (error || !data) return [];

  const filas = data as unknown as {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
    menu_items: { id: string; name: string };
  }[];

  return filas.map((fila) => ({
    id: fila.id,
    calificacion: fila.rating,
    comentario: fila.comment?.trim() || null,
    fecha: fila.created_at,
    platoId: fila.menu_items.id,
    platoNombre: fila.menu_items.name,
  }));
}
