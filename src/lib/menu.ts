import "server-only";

import { getSupabase } from "@/lib/supabase";
import type {
  CategoryRow,
  MenuItemRow,
  RatingRow,
  RestaurantRow,
  WeeklyTopRow,
} from "@/types/database";
import type { Calificacion, Categoria, Plato, Restaurante } from "@/types/menu";

/**
 * Acceso a los datos del menu.
 *
 * En la Parte 1 esto leia de un archivo. Ahora consulta Supabase, pero la forma
 * que devuelve es la misma, asi que los componentes no cambiaron.
 */

const SIN_CALIFICAR: Calificacion = { promedio: 0, cantidad: 0 };

function aPlato(fila: MenuItemRow, calificacion: Calificacion): Plato {
  return {
    id: fila.id,
    nombre: fila.name,
    descripcion: fila.description ?? "",
    precio: fila.price,
    imagen: fila.image_url,
    modelo3dGlb: fila.model_glb_url,
    modelo3dUsdz: fila.model_usdz_url,
    destacado: fila.is_specialty,
    disponible: fila.is_available,
    orden: fila.sort_order,
    calificacion,
  };
}

/** Busca las calificaciones de varios platos en una sola consulta. */
async function getCalificaciones(
  ids: string[],
): Promise<Map<string, Calificacion>> {
  const mapa = new Map<string, Calificacion>();
  if (ids.length === 0) return mapa;

  const { data, error } = await getSupabase()
    .from("menu_item_ratings")
    .select("menu_item_id, average_rating, review_count")
    .in("menu_item_id", ids);

  // Las calificaciones son decorativas: si fallan, el menu igual se muestra.
  if (error || !data) return mapa;

  for (const fila of data as RatingRow[]) {
    mapa.set(fila.menu_item_id, {
      promedio: Number(fila.average_rating),
      cantidad: Number(fila.review_count),
    });
  }
  return mapa;
}

function aRestaurante(
  fila: RestaurantRow,
  categorias: Categoria[],
): Restaurante {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.name,
    descripcion: fila.description ?? "",
    logo: fila.logo_url,
    horario: fila.schedule ?? "",
    moneda: fila.currency,
    locale: fila.locale,
    categorias,
  };
}

type FilaMenuAnidada = RestaurantRow & {
  categories: (CategoryRow & { menu_items: MenuItemRow[] })[];
};

/**
 * Menu completo de un restaurante: categorias ordenadas, con sus platos
 * disponibles y sus calificaciones. Son dos consultas, no una por plato.
 */
export async function getMenu(slug: string): Promise<Restaurante | null> {
  const { data, error } = await getSupabase()
    .from("restaurants")
    .select("*, categories(*, menu_items(*))")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`No pude leer el menu: ${error.message}`);
  if (!data) return null;

  const fila = data as FilaMenuAnidada;

  const idsDePlatos = fila.categories.flatMap((categoria) =>
    categoria.menu_items.filter((p) => p.is_available).map((p) => p.id),
  );
  const calificaciones = await getCalificaciones(idsDePlatos);

  // El orden se resuelve aca: PostgREST no ordena relaciones anidadas de dos
  // niveles, y el volumen de un menu no justifica complicar la consulta.
  const categorias: Categoria[] = fila.categories
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((categoria) => ({
      id: categoria.id,
      nombre: categoria.name,
      icono: categoria.icon,
      orden: categoria.sort_order,
      platos: categoria.menu_items
        .filter((plato) => plato.is_available)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((plato) =>
          aPlato(plato, calificaciones.get(plato.id) ?? SIN_CALIFICAR),
        ),
    }));

  return aRestaurante(fila, categorias);
}

type FilaPlatoAnidada = MenuItemRow & {
  categories: CategoryRow;
  restaurants: RestaurantRow;
};

/** Un plato con su categoria y su restaurante, para la pagina de detalle. */
export async function getPlato(
  slug: string,
  platoId: string,
): Promise<{
  plato: Plato;
  categoria: Categoria;
  restaurante: Restaurante;
} | null> {
  const { data, error } = await getSupabase()
    .from("menu_items")
    .select("*, categories(*), restaurants(*)")
    .eq("id", platoId)
    .maybeSingle();

  if (error) throw new Error(`No pude leer el plato: ${error.message}`);
  if (!data) return null;

  const fila = data as FilaPlatoAnidada;
  // El id del plato es unico, pero la URL tambien nombra al restaurante:
  // si no coinciden, la URL esta mal armada y corresponde un 404.
  if (fila.restaurants.slug !== slug) return null;

  const calificaciones = await getCalificaciones([fila.id]);

  return {
    plato: aPlato(fila, calificaciones.get(fila.id) ?? SIN_CALIFICAR),
    categoria: {
      id: fila.categories.id,
      nombre: fila.categories.name,
      icono: fila.categories.icon,
      orden: fila.categories.sort_order,
      platos: [],
    },
    restaurante: aRestaurante(fila.restaurants, []),
  };
}

/** Slug del primer restaurante, para la redireccion de la raiz. */
export async function getPrimerSlug(): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from("restaurants")
    .select("slug")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.slug;
}

/** Cantidad minima de platos con vistas para que el ranking tenga sentido. */
export const MINIMO_PARA_RANKING = 3;

/**
 * Los platos mas mirados de los ultimos 7 dias.
 *
 * Devuelve lista vacia si no hay al menos MINIMO_PARA_RANKING platos con
 * vistas: un ranking de un solo plato no es un ranking.
 */
export async function getMasMiradosDeLaSemana(
  restaurante: Restaurante,
): Promise<{ plato: Plato; vistas: number }[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc("get_weekly_top_items", {
    p_restaurant_id: restaurante.id,
    p_days: 7,
    p_limit: MINIMO_PARA_RANKING,
  });

  if (error || !data) return [];

  const filas = data as WeeklyTopRow[];
  if (filas.length < MINIMO_PARA_RANKING) return [];

  const porId = new Map(
    restaurante.categorias.flatMap((categoria) =>
      categoria.platos.map((plato) => [plato.id, plato] as const),
    ),
  );

  return filas
    .map((fila) => {
      const plato = porId.get(fila.menu_item_id);
      return plato ? { plato, vistas: Number(fila.view_count) } : null;
    })
    .filter((entrada): entrada is { plato: Plato; vistas: number } =>
      Boolean(entrada),
    );
}

/** Icono de la categoria a la que pertenece cada plato del ranking. */
export function getIconoDePlato(restaurante: Restaurante, platoId: string) {
  for (const categoria of restaurante.categorias) {
    if (categoria.platos.some((plato) => plato.id === platoId)) {
      return categoria.icono;
    }
  }
  return "principal" as const;
}
