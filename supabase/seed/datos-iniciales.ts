/**
 * Contenido inicial del menu.
 *
 * Esto era `src/data/menu.ts` en la Parte 1, cuando la app leia los platos
 * directo de un archivo. Ahora la app lee de Supabase y este archivo quedo
 * como la fuente del seed: se corre una vez para poblar la base y despues el
 * contenido se edita en Supabase, no aca.
 *
 * Correr con:  npm run seed
 */

export type IconoCategoria = "entrada" | "principal" | "postre" | "bebida";

export interface PlatoSeed {
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  modeloGlb: string | null;
  modeloUsdz: string | null;
  esEspecialidad: boolean;
}

export interface CategoriaSeed {
  nombre: string;
  icono: IconoCategoria;
  platos: PlatoSeed[];
}

export interface RestauranteSeed {
  slug: string;
  nombre: string;
  descripcion: string;
  logo: string | null;
  horario: string;
  moneda: string;
  locale: string;
  categorias: CategoriaSeed[];
}

/** Modelo de prueba a escala real (24 cm). Ver public/models/README.txt. */
const GLB = "/models/plato-demo.glb";
const USDZ = "/models/plato-demo.usdz";

export const restauranteInicial: RestauranteSeed = {
  slug: "demo",
  nombre: "Restaurante Demo",
  descripcion: "Carta de muestra",
  logo: null,
  horario: "Todos los dias de 12:00 a 23:00",
  moneda: "COP",
  locale: "es-CO",
  categorias: [
    {
      nombre: "Entradas",
      icono: "entrada",
      platos: [
        {
          nombre: "Sopa del dia",
          descripcion: "Caldo de verduras de temporada con hierbas frescas.",
          precio: 14000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Ensalada de la casa",
          descripcion: "Hojas verdes, tomate, queso y vinagreta de la casa.",
          precio: 18000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Tabla para compartir",
          descripcion: "Quesos, embutidos y encurtidos. Para dos personas.",
          precio: 38000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: true,
        },
      ],
    },
    {
      nombre: "Principales",
      icono: "principal",
      platos: [
        {
          nombre: "Plato de carne",
          descripcion: "Corte a la parrilla con guarnicion a eleccion.",
          precio: 46000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: true,
        },
        {
          nombre: "Pasta de la casa",
          descripcion: "Pasta fresca con salsa a eleccion y queso rallado.",
          precio: 32000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Pescado del dia",
          descripcion: "Filete a la plancha con vegetales salteados.",
          precio: 42000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Hamburguesa clasica",
          descripcion: "Carne, queso, lechuga y tomate. Con papas.",
          precio: 29000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Opcion vegetariana",
          descripcion: "Vegetales asados, legumbres y granos integrales.",
          precio: 27000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
      ],
    },
    {
      nombre: "Postres",
      icono: "postre",
      platos: [
        {
          nombre: "Postre de chocolate",
          descripcion: "Chocolate tibio con helado de crema.",
          precio: 16000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: true,
        },
        {
          nombre: "Tarta del dia",
          descripcion: "Porcion de la tarta que preparamos hoy.",
          precio: 13000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Helado artesanal",
          descripcion: "Dos bochas del sabor que elijas.",
          precio: 11000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
      ],
    },
    {
      nombre: "Bebidas",
      icono: "bebida",
      platos: [
        {
          nombre: "Limonada natural",
          descripcion: "Preparada al momento, con o sin azucar.",
          precio: 9000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Jugo de fruta",
          descripcion: "En agua o en leche. Consultar frutas del dia.",
          precio: 10000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Cafe",
          descripcion: "Espresso, americano o con leche.",
          precio: 7000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
        {
          nombre: "Gaseosa",
          descripcion: "Linea de gaseosas, botella de 350 ml.",
          precio: 6000,
          imagen: null,
          modeloGlb: GLB,
          modeloUsdz: USDZ,
          esEspecialidad: false,
        },
      ],
    },
  ],
};
