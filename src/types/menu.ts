import type { Tema } from "@/lib/tema";

/**
 * Forma de los datos del menu.
 *
 * Esta es la misma forma que despues va a devolver Supabase, para que el paso
 * de datos hardcodeados a base de datos real no obligue a tocar los componentes.
 */

export type CategoriaIcono = "entrada" | "principal" | "postre" | "bebida";

export interface Calificacion {
  /** Promedio de estrellas redondeado a un decimal. 0 si no hay resenas. */
  promedio: number;
  cantidad: number;
}

export interface Plato {
  /** uuid de la fila en menu_items. */
  id: string;
  nombre: string;
  /** Una sola linea. Se muestra completa en el detalle y recortada en la card. */
  descripcion: string;
  /** Valor entero en la moneda local, sin decimales ni separadores. */
  precio: number;
  /** Ruta o URL de la foto. `null` mientras el restaurante no subio la suya. */
  imagen: string | null;
  /** Modelo para Android / Scene Viewer. `null` si el plato todavia no tiene 3D. */
  modelo3dGlb: string | null;
  /** Modelo para iOS / Quick Look. `null` si el plato todavia no tiene 3D. */
  modelo3dUsdz: string | null;
  /** Especialidad de la casa (menu_items.is_specialty). */
  destacado: boolean;
  /** menu_items.is_available. Los no disponibles no se listan. */
  disponible: boolean;
  /** Orden dentro de la categoria. */
  orden: number;
  /** Promedio y cantidad de resenas. Viene de la vista menu_item_ratings. */
  calificacion: Calificacion;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: CategoriaIcono;
  orden: number;
  platos: Plato[];
}

export type DiaSemana =
  | "lunes"
  | "martes"
  | "miercoles"
  | "jueves"
  | "viernes"
  | "sabado"
  | "domingo";

export interface FranjaHoraria {
  /** "HH:MM" en 24 horas. */
  abre: string;
  cierra: string;
  cerrado: boolean;
}

export type Horarios = Record<DiaSemana, FranjaHoraria>;

export interface Restaurante {
  /** uuid de la fila en restaurants. */
  id: string;
  /** Segmento de la URL: /[slug] */
  slug: string;
  nombre: string;
  /** Texto corto bajo el nombre. */
  descripcion: string;
  /** Ruta al logo. `null` usa el monograma generado con la inicial. */
  logo: string | null;
  direccion: string | null;
  /** Horario de atencion por dia de la semana. */
  horarios: Horarios;
  /** Apariencia elegida por el restaurante: acento, distribucion, esquinas. */
  tema: Tema;
  /** Zona IANA, ej. "America/Bogota". Define contra que reloj se abre y cierra. */
  zonaHoraria: string;
  /** Codigo ISO de la moneda para formatear precios. */
  moneda: string;
  /** Locale usado para formatear precios. */
  locale: string;
  categorias: Categoria[];
}
