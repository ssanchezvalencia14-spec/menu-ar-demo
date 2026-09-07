/**
 * Forma de las filas de Supabase.
 *
 * Escrito a mano para que coincida con supabase/migrations/0001_init.sql.
 * Si cambia el esquema, hay que actualizar este archivo (o generarlo con
 * `supabase gen types typescript`).
 */

import type { CategoriaIcono } from "@/types/menu";

export interface RestaurantRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  /** jsonb sin garantias de forma: pasarlo por normalizarHorarios(). */
  hours: unknown;
  timezone: string;
  /** OBSOLETO desde la migracion 0002. El horario real vive en `hours`. */
  schedule: string | null;
  owner_user_id: string | null;
  currency: string;
  locale: string;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  restaurant_id: string;
  name: string;
  icon: CategoriaIcono;
  sort_order: number;
  created_at: string;
}

export interface MenuItemRow {
  id: string;
  restaurant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  model_glb_url: string | null;
  model_usdz_url: string | null;
  is_specialty: boolean;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  menu_item_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** Fila de la vista menu_item_ratings. */
export interface RatingRow {
  menu_item_id: string;
  average_rating: number;
  review_count: number;
}

/** Fila que devuelve la funcion get_weekly_top_items. */
export interface WeeklyTopRow {
  menu_item_id: string;
  view_count: number;
}
