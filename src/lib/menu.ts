import "server-only";

import { normalizarHorarios } from "@/lib/horarios";
import { normalizarTema } from "@/lib/tema";
import { getSupabasePublico } from "@/lib/supabase/servidor";
import type {
  CategoryRow,
  MenuItemRow,
  RatingRow,
  RestaurantRow,
  WeeklyTopRow,
} from "@/types/database";
import type { Calificacion, Categoria, Plato, Restaurante } from "@/types/menu";

/**
 * Lectura del menu publico. El comensal no esta autenticado, asi que todo
 * esto pasa por las politicas de lectura publica de RLS.
 */

const SIN_CALIFICAR: Calificacion = { promedio: 0, cantidad: 0 };

/**
 * Columnas del restaurante que puede ver un comensal.
 *
 * Se listan a mano, en vez de pedir todas, para dejar afuera `owner_user_id`:
 * es el identificador interno del usuario en auth.users y no tiene por que
 * salir de la aplicacion.
 *
 * Y no es solo prolijidad. PostgREST traduce un `select=*` a un `SELECT *`,
 * que exige permiso sobre la tabla entera; mientras la consulta pida todo, la
 * base no puede restringir la columna. Pedir columnas explicitas es lo que
 * permite que el GRANT por columna funcione.
 */
const COLUMNAS_PUBLICAS_DEL_RESTAURANTE =
  "id, slug, name, description, logo_url, address, hours, tema, timezone, currency, locale, created_at";

/**
 * Las mismas columnas menos las que agrego una migracion reciente.
 *
 * Es el plan B de getMenu cuando el codigo esta por delante de la base. Al
 * agregar una columna nueva a la lista de arriba, NO agregarla aca: la gracia
 * es justamente que esta lista solo tenga lo que existe desde siempre.
 */
const COLUMNAS_MINIMAS_DEL_RESTAURANTE =
  "id, slug, name, description, logo_url, address, hours, timezone, currency, locale, created_at";

export function aPlato(fila: MenuItemRow, calificacion: Calificacion): Plato {
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

export function aRestaurante(
  fila: RestaurantRow,
  categorias: Categoria[],
): Restaurante {
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
    categorias,
  };
}

/** Calificaciones de varios platos en una sola consulta, no una por plato. */
export async function getCalificaciones(
  ids: string[],
): Promise<Map<string, Calificacion>> {
  const mapa = new Map<string, Calificacion>();
  if (ids.length === 0) return mapa;

  const { data, error } = await getSupabasePublico()
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

type FilaMenuAnidada = RestaurantRow & {
  categories: (CategoryRow & { menu_items: MenuItemRow[] })[];
};

/**
 * Codigo de Postgres para "esa columna no existe".
 *
 * Aparece cuando el codigo ya se desplego y la migracion todavia no corrio.
 * Siempre hay una ventana entre las dos cosas, y tambien pasa si alguien
 * revierte la base sin revertir el despliegue.
 */
const COLUMNA_INEXISTENTE = "42703";

/**
 * Corre una consulta con las columnas completas y, si la base todavia no tiene
 * alguna, la reintenta con las minimas.
 *
 * Esta envuelto en una funcion y no copiado en cada consulta por un motivo
 * concreto: la primera version solo protegia a getMenu, y getPlato quedo sin
 * red usando la MISMA lista de columnas. El menu aguantaba y el detalle del
 * plato respondia 500. Cualquier consulta nueva que use la lista completa
 * tiene que pasar por aca.
 */
async function conRespaldoDeColumnas<T>(
  consultar: (columnas: string) => PromiseLike<{
    data: T | null;
    error: { code?: string; message: string } | null;
  }>,
) {
  const primera = await consultar(COLUMNAS_PUBLICAS_DEL_RESTAURANTE);
  if (primera.error?.code !== COLUMNA_INEXISTENTE) return primera;

  console.error(
    `Falta una columna en restaurants (${primera.error.message}). ` +
      "Se sirve con la apariencia por defecto. Corre las migraciones pendientes.",
  );
  return consultar(COLUMNAS_MINIMAS_DEL_RESTAURANTE);
}

/** Menu completo de un restaurante, solo con lo que el comensal debe ver. */
export async function getMenu(slug: string): Promise<Restaurante | null> {
  const { data, error } = await conRespaldoDeColumnas((columnas) =>
    getSupabasePublico()
      .from("restaurants")
      .select(`${columnas}, categories(*, menu_items(*))`)
      .eq("slug", slug)
      .maybeSingle(),
  );

  if (error) throw new Error(`No pude leer el menu: ${error.message}`);
  if (!data) return null;

  // Doble conversion a proposito: al pasar las columnas como variable en vez
  // de cadena literal, supabase-js ya no puede inferir la forma del resultado.
  // La forma real la garantiza COLUMNAS_PUBLICAS_DEL_RESTAURANTE.
  const fila = data as unknown as FilaMenuAnidada;

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
    }))
    // Una categoria vacia en el menu publico es una tab que no lleva a nada.
    .filter((categoria) => categoria.platos.length > 0);

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
  const { data, error } = await conRespaldoDeColumnas((columnas) =>
    getSupabasePublico()
      .from("menu_items")
      .select(`*, categories(*), restaurants(${columnas})`)
      .eq("id", platoId)
      .maybeSingle(),
  );

  if (error) throw new Error(`No pude leer el plato: ${error.message}`);
  if (!data) return null;

  const fila = data as unknown as FilaPlatoAnidada;
  // El id del plato es unico, pero la URL tambien nombra al restaurante:
  // si no coinciden, la URL esta mal armada y corresponde un 404.
  if (fila.restaurants.slug !== slug) return null;
  // Un plato pausado no debe ser accesible ni con el link directo.
  if (!fila.is_available) return null;

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
  const { data, error } = await getSupabasePublico()
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

/** Ventanas que se prueban, de la mas reciente a la mas amplia. */
const VENTANAS = [
  { dias: 7, periodo: "semana" as const },
  { dias: 30, periodo: "mes" as const },
];

export type PeriodoDelRanking = "semana" | "mes";

export interface RankingDeVistas {
  platos: { plato: Plato; vistas: number }[];
  /** De que ventana salieron los datos. Define el titulo que se muestra. */
  periodo: PeriodoDelRanking;
}

/**
 * Los platos mas mirados, con la ventana de tiempo mas corta que tenga datos.
 *
 * Primero mira los ultimos 7 dias. Si no llega a MINIMO_PARA_RANKING platos
 * distintos, amplia a 30 y avisa el cambio en `periodo` para que el titulo no
 * diga "esta semana" sobre datos de un mes.
 *
 * La escalera existe porque un local recien abierto, o cualquiera despues de
 * una semana floja, se quedaba sin la seccion justo cuando mas la necesita
 * para mostrarla. Un ranking de un solo plato sigue sin ser un ranking, asi
 * que el minimo no se toca: lo que se estira es el periodo.
 */
export async function getMasMirados(
  restaurante: Restaurante,
): Promise<RankingDeVistas> {
  const vacio: RankingDeVistas = { platos: [], periodo: "semana" };

  const porId = new Map(
    restaurante.categorias.flatMap((categoria) =>
      categoria.platos.map((plato) => [plato.id, plato] as const),
    ),
  );

  for (const { dias, periodo } of VENTANAS) {
    const { data, error } = await getSupabasePublico().rpc(
      "get_weekly_top_items",
      {
        p_restaurant_id: restaurante.id,
        p_days: dias,
        p_limit: MINIMO_PARA_RANKING,
      },
    );

    if (error || !data) return vacio;

    const filas = data as WeeklyTopRow[];
    if (filas.length < MINIMO_PARA_RANKING) continue;

    // Un plato puede estar en el ranking y haberse pausado despues: si ya no
    // esta en el menu, no puede aparecer aca.
    const platos = filas
      .map((fila) => {
        const plato = porId.get(fila.menu_item_id);
        return plato ? { plato, vistas: Number(fila.view_count) } : null;
      })
      .filter((entrada): entrada is { plato: Plato; vistas: number } =>
        Boolean(entrada),
      );

    if (platos.length < MINIMO_PARA_RANKING) continue;

    return { platos, periodo };
  }

  return vacio;
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
