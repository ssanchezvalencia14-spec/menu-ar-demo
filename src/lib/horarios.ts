import type { DiaSemana, FranjaHoraria, Horarios } from "@/types/menu";

/**
 * Calculo de "Abierto ahora".
 *
 * Todo se resuelve en la zona horaria del restaurante, nunca con el reloj del
 * servidor ni con el del celular del comensal. En Vercel el servidor corre en
 * UTC: comparar contra esa hora mostraria "Cerrado" a las 19:00 de Bogota,
 * en plena cena.
 */

export const DIAS: DiaSemana[] = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const NOMBRE_DEL_DIA: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miercoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sabado",
  domingo: "Domingo",
};

/** Franja por defecto para un dia que todavia no se configuro. */
export const FRANJA_POR_DEFECTO: FranjaHoraria = {
  abre: "12:00",
  cierra: "23:00",
  cerrado: false,
};

export function horariosPorDefecto(): Horarios {
  return Object.fromEntries(
    DIAS.map((dia) => [dia, { ...FRANJA_POR_DEFECTO }]),
  ) as Horarios;
}

/** "14:30" -> 870. Devuelve null si el texto no es una hora valida. */
export function aMinutos(hora: string): number | null {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(hora.trim());
  if (!partes) return null;
  const h = Number(partes[1]);
  const m = Number(partes[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** Momento actual en la zona del restaurante: que dia es y cuantos minutos van. */
function ahoraEnZona(zona: string, referencia: Date) {
  let partes;
  try {
    partes = new Intl.DateTimeFormat("en-US", {
      timeZone: zona,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(referencia);
  } catch {
    // Zona horaria invalida: se cae a UTC en vez de romper la pagina.
    partes = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(referencia);
  }

  const buscar = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "";

  const indicePorAbreviatura: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };

  const indiceDia = indicePorAbreviatura[buscar("weekday")] ?? 0;
  // "24" aparece a la medianoche en algunos entornos; equivale a las 00.
  const hora = Number(buscar("hour")) % 24;
  const minuto = Number(buscar("minute"));

  return { indiceDia, minutos: hora * 60 + minuto };
}

function franjaDe(horarios: Horarios, indiceDia: number): FranjaHoraria {
  return horarios[DIAS[((indiceDia % 7) + 7) % 7]] ?? FRANJA_POR_DEFECTO;
}

export interface EstadoDeApertura {
  abierto: boolean;
  /**
   * Complemento del estado, sin repetir la palabra "abierto" o "cerrado":
   * "hasta las 23:00", "abre a las 12:00". Cadena vacia si no aporta nada.
   */
  detalle: string;
}

/**
 * Contempla los locales que cierran despues de medianoche. Para un bar de
 * 20:00 a 02:00, la comparacion directa `abre <= ahora <= cierra` da falso
 * siempre, porque 02:00 es menor que 20:00.
 */
export function estadoDeApertura(
  horarios: Horarios,
  zona: string,
  referencia: Date = new Date(),
): EstadoDeApertura {
  const { indiceDia, minutos } = ahoraEnZona(zona, referencia);

  const hoy = franjaDe(horarios, indiceDia);
  const ayer = franjaDe(horarios, indiceDia - 1);

  // La franja de ayer puede seguir abierta si cruzaba la medianoche.
  const cierraAyer = aMinutos(ayer.cierra);
  const abreAyer = aMinutos(ayer.abre);
  if (
    !ayer.cerrado &&
    cierraAyer !== null &&
    abreAyer !== null &&
    cierraAyer <= abreAyer &&
    minutos < cierraAyer
  ) {
    return { abierto: true, detalle: `hasta las ${ayer.cierra}` };
  }

  if (hoy.cerrado) {
    return { abierto: false, detalle: "" };
  }

  const abre = aMinutos(hoy.abre);
  const cierra = aMinutos(hoy.cierra);
  if (abre === null || cierra === null) {
    return { abierto: false, detalle: "" };
  }

  const cruzaMedianoche = cierra <= abre;
  const abierto = cruzaMedianoche
    ? minutos >= abre
    : minutos >= abre && minutos < cierra;

  if (abierto) {
    return { abierto: true, detalle: `hasta las ${hoy.cierra}` };
  }

  if (minutos < abre) {
    return { abierto: false, detalle: `abre a las ${hoy.abre}` };
  }
  return { abierto: false, detalle: "" };
}

/** Normaliza lo que venga de la base, que es jsonb sin garantias de forma. */
export function normalizarHorarios(crudo: unknown): Horarios {
  const base = horariosPorDefecto();
  if (!crudo || typeof crudo !== "object") return base;

  for (const dia of DIAS) {
    const valor = (crudo as Record<string, unknown>)[dia];
    if (!valor || typeof valor !== "object") continue;
    const franja = valor as Record<string, unknown>;
    base[dia] = {
      abre: typeof franja.abre === "string" ? franja.abre : FRANJA_POR_DEFECTO.abre,
      cierra:
        typeof franja.cierra === "string"
          ? franja.cierra
          : FRANJA_POR_DEFECTO.cierra,
      cerrado: franja.cerrado === true,
    };
  }

  return base;
}
