/**
 * Apariencia del menu publico, elegida por cada restaurante.
 *
 * Criterio de diseno: NO hay selector de color libre ni control de tamanos. Un
 * dueno de restaurante no es disenador, y darle un color arbitrario termina en
 * menus ilegibles (texto amarillo sobre blanco) que despues parecen culpa del
 * producto. Se ofrecen combinaciones cerradas, todas probadas en contraste.
 *
 * Por el mismo motivo cada opcion se nombra por lo que hace y no por su
 * termino tecnico: "Lista" y no "una columna", "Suaves" y no "border-radius".
 */

export const ACENTOS = {
  ambar: { nombre: "Ambar", color: "#b45309", fondo: "#fef6e7" },
  verde: { nombre: "Verde", color: "#15803d", fondo: "#effaf1" },
  azul: { nombre: "Azul", color: "#1d4ed8", fondo: "#eef2ff" },
  vino: { nombre: "Vino", color: "#9f1239", fondo: "#fef1f4" },
  grafito: { nombre: "Grafito", color: "#3f3f46", fondo: "#f4f4f5" },
} as const;

export const DISTRIBUCIONES = {
  grilla: {
    nombre: "Grilla",
    ayuda: "Dos platos por fila, con la foto grande. Luce mejor con fotos.",
  },
  lista: {
    nombre: "Lista",
    ayuda: "Un plato por fila, con la foto chica al costado. Entran mas platos.",
  },
} as const;

export const ESQUINAS = {
  redondeadas: { nombre: "Redondeadas", radio: "1rem" },
  suaves: { nombre: "Suaves", radio: "0.5rem" },
  rectas: { nombre: "Rectas", radio: "0rem" },
} as const;

export type Acento = keyof typeof ACENTOS;
export type Distribucion = keyof typeof DISTRIBUCIONES;
export type Esquinas = keyof typeof ESQUINAS;

export interface Tema {
  acento: Acento;
  distribucion: Distribucion;
  esquinas: Esquinas;
}

/** Lo que ve un restaurante que nunca toco la apariencia. */
export const TEMA_POR_DEFECTO: Tema = {
  acento: "ambar",
  distribucion: "grilla",
  esquinas: "redondeadas",
};

/**
 * Convierte el jsonb crudo en un Tema valido.
 *
 * La columna es jsonb: la base no garantiza su forma, y un valor viejo o
 * escrito a mano puede traer cualquier cosa. Cada campo se valida por separado
 * para que un ajuste invalido no arrastre a los otros al valor por defecto.
 */
export function normalizarTema(crudo: unknown): Tema {
  if (typeof crudo !== "object" || crudo === null) return TEMA_POR_DEFECTO;

  const t = crudo as Record<string, unknown>;
  const valido = <T extends string>(
    valor: unknown,
    opciones: Record<string, unknown>,
    porDefecto: T,
  ): T =>
    typeof valor === "string" && valor in opciones ? (valor as T) : porDefecto;

  return {
    acento: valido<Acento>(t.acento, ACENTOS, TEMA_POR_DEFECTO.acento),
    distribucion: valido<Distribucion>(
      t.distribucion,
      DISTRIBUCIONES,
      TEMA_POR_DEFECTO.distribucion,
    ),
    esquinas: valido<Esquinas>(t.esquinas, ESQUINAS, TEMA_POR_DEFECTO.esquinas),
  };
}

/**
 * Variables CSS que aplica el menu publico.
 *
 * Se inyectan como `style` en el contenedor del menu y no en `:root` ni en una
 * hoja global: cada restaurante tiene su tema y el mismo servidor sirve a
 * todos. Tocar algo global haria que el tema de un local se filtre al de otro
 * en la navegacion del lado del cliente.
 */
export function variablesDelTema(tema: Tema): React.CSSProperties {
  return {
    "--color-destacado": ACENTOS[tema.acento].color,
    "--color-destacado-fondo": ACENTOS[tema.acento].fondo,
    "--radius-card": ESQUINAS[tema.esquinas].radio,
  } as React.CSSProperties;
}
