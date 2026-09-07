"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DIAS, aMinutos } from "@/lib/horarios";
import { exigirRestaurante, exigirSesion } from "@/lib/admin/datos";
import type { Resultado } from "@/lib/admin/tipos";
import type { Horarios } from "@/types/menu";

/**
 * Escrituras del panel.
 *
 * Ninguna de estas funciones filtra por dueno a mano: usan el cliente con
 * sesion y las politicas de RLS hacen el filtrado en la base. Si alguien
 * manipulara un id desde el navegador, la operacion afecta cero filas.
 *
 * Despues de cada cambio se revalida el menu publico. No hay paso de
 * "publicar": lo que se edita aca se ve al instante.
 */


/**
 * Las acciones sin valor de retorno no tienen donde mostrar un error al
 * usuario. Como minimo tiene que quedar registrado, no desaparecer en silencio.
 */
function avisarSiFallo(error: { message: string } | null | undefined, que: string) {
  if (error) console.error(`No pude ${que}: ${error.message}`);
}

/** Refresca el menu del comensal y el panel. */
function refrescar(slug: string, ...rutas: string[]) {
  revalidatePath(`/${slug}`, "layout");
  for (const ruta of rutas) revalidatePath(ruta);
}

// ------------------------------------------------------- Restaurante ---

export async function guardarRestaurante(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const descripcion = String(formData.get("descripcion") ?? "").trim();
  const direccion = String(formData.get("direccion") ?? "").trim();
  const logo = String(formData.get("logo") ?? "").trim();
  const zonaHoraria = String(formData.get("zonaHoraria") ?? "").trim();

  if (!nombre) return { estado: "error", mensaje: "El nombre no puede quedar vacio." };

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      estado: "error",
      mensaje:
        "La direccion web solo admite minusculas, numeros y guiones. Sin espacios ni acentos.",
    };
  }

  // Intl valida la zona: una zona invalida romperia el calculo de apertura.
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zonaHoraria });
  } catch {
    return { estado: "error", mensaje: "Esa zona horaria no existe." };
  }

  const { error } = await supabase
    .from("restaurants")
    .update({
      name: nombre,
      slug,
      description: descripcion || null,
      address: direccion || null,
      logo_url: logo || null,
      timezone: zonaHoraria,
    })
    .eq("id", restaurante.id);

  if (error) {
    if (error.code === "23505") {
      return {
        estado: "error",
        mensaje: "Esa direccion web ya la esta usando otro restaurante.",
      };
    }
    return { estado: "error", mensaje: "No pude guardar los cambios." };
  }

  refrescar(slug, "/admin", "/admin/restaurante");
  if (slug !== restaurante.slug) refrescar(restaurante.slug);
  return { estado: "ok", mensaje: "Datos guardados." };
}

export async function guardarHorarios(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const horarios = {} as Horarios;

  for (const dia of DIAS) {
    const cerrado = formData.get(`${dia}-cerrado`) === "on";
    const abre = String(formData.get(`${dia}-abre`) ?? "").trim();
    const cierra = String(formData.get(`${dia}-cierra`) ?? "").trim();

    if (!cerrado && (aMinutos(abre) === null || aMinutos(cierra) === null)) {
      return {
        estado: "error",
        mensaje: `Revisa las horas del ${dia}: tienen que estar en formato HH:MM.`,
      };
    }

    horarios[dia] = { abre, cierra, cerrado };
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ hours: horarios })
    .eq("id", restaurante.id);

  if (error) return { estado: "error", mensaje: "No pude guardar los horarios." };

  refrescar(restaurante.slug, "/admin/horarios");
  return { estado: "ok", mensaje: "Horarios guardados." };
}

// -------------------------------------------------------- Categorias ---

export async function crearCategoria(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const icono = String(formData.get("icono") ?? "principal");

  if (!nombre) return { estado: "error", mensaje: "Ponele un nombre a la seccion." };

  const { data: ultima } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("restaurant_id", restaurante.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("categories").insert({
    restaurant_id: restaurante.id,
    name: nombre,
    icon: icono,
    sort_order: (ultima?.sort_order ?? 0) + 1,
  });

  if (error) {
    if (error.code === "23505") {
      return { estado: "error", mensaje: "Ya tenes una seccion con ese nombre." };
    }
    return { estado: "error", mensaje: "No pude crear la seccion." };
  }

  refrescar(restaurante.slug, "/admin/secciones", "/admin");
  return { estado: "ok", mensaje: "Seccion creada." };
}

export async function renombrarCategoria(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const icono = String(formData.get("icono") ?? "principal");

  if (!nombre) return { estado: "error", mensaje: "El nombre no puede quedar vacio." };

  const { error } = await supabase
    .from("categories")
    .update({ name: nombre, icon: icono })
    .eq("id", id);

  if (error) return { estado: "error", mensaje: "No pude renombrar la seccion." };

  refrescar(restaurante.slug, "/admin/secciones");
  return { estado: "ok", mensaje: "Seccion actualizada." };
}

/** Sube o baja una seccion intercambiando el orden con su vecina. */
export async function moverCategoria(id: string, direccion: "arriba" | "abajo") {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const { data } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("restaurant_id", restaurante.id)
    .order("sort_order");

  const lista = (data ?? []) as { id: string; sort_order: number }[];
  const posicion = lista.findIndex((c) => c.id === id);
  const destino = direccion === "arriba" ? posicion - 1 : posicion + 1;
  if (posicion === -1 || destino < 0 || destino >= lista.length) return;

  // Se reescriben todas las posiciones en vez de intercambiar dos valores:
  // los sort_order pueden venir con huecos o repetidos de ediciones previas.
  const reordenada = [...lista];
  [reordenada[posicion], reordenada[destino]] = [
    reordenada[destino],
    reordenada[posicion],
  ];

  const fallos = await Promise.all(
    reordenada.map((categoria, indice) =>
      supabase
        .from("categories")
        .update({ sort_order: indice + 1 })
        .eq("id", categoria.id),
    ),
  );
  avisarSiFallo(fallos.find((r) => r.error)?.error, "reordenar las secciones");

  refrescar(restaurante.slug, "/admin/secciones");
}

export async function eliminarCategoria(id: string) {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const { error } = await supabase.from("categories").delete().eq("id", id);
  avisarSiFallo(error, "eliminar la seccion");

  refrescar(restaurante.slug, "/admin/secciones", "/admin/platos", "/admin");
}

// ----------------------------------------------------------- Platos ---

function leerPlato(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const categoriaId = String(formData.get("categoriaId") ?? "");
  const precioCrudo = String(formData.get("precio") ?? "").replace(
    /[^\d]/g,
    "",
  );
  const precio = Number(precioCrudo);

  return {
    nombre,
    categoriaId,
    precio,
    descripcion: String(formData.get("descripcion") ?? "").trim(),
    imagen: String(formData.get("imagen") ?? "").trim(),
    modeloGlb: String(formData.get("modeloGlb") ?? "").trim(),
    modeloUsdz: String(formData.get("modeloUsdz") ?? "").trim(),
    esEspecialidad: formData.get("esEspecialidad") === "on",
    disponible: formData.get("disponible") === "on",
  };
}

function validarPlato(datos: ReturnType<typeof leerPlato>): string | null {
  if (!datos.nombre) return "Ponele un nombre al plato.";
  if (!datos.categoriaId) return "Elegi en que seccion va.";
  if (!Number.isInteger(datos.precio) || datos.precio < 0) {
    return "El precio tiene que ser un numero entero, sin decimales.";
  }
  return null;
}

export async function crearPlato(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const datos = leerPlato(formData);
  const problema = validarPlato(datos);
  if (problema) return { estado: "error", mensaje: problema };

  const { data: ultimo } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", datos.categoriaId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("menu_items").insert({
    restaurant_id: restaurante.id,
    category_id: datos.categoriaId,
    name: datos.nombre,
    description: datos.descripcion || null,
    price: datos.precio,
    image_url: datos.imagen || null,
    model_glb_url: datos.modeloGlb || null,
    model_usdz_url: datos.modeloUsdz || null,
    is_specialty: datos.esEspecialidad,
    is_available: datos.disponible,
    sort_order: (ultimo?.sort_order ?? 0) + 1,
  });

  if (error) return { estado: "error", mensaje: "No pude crear el plato." };

  refrescar(restaurante.slug, "/admin/platos", "/admin");
  redirect("/admin/platos");
}

export async function guardarPlato(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const id = String(formData.get("id") ?? "");
  const datos = leerPlato(formData);
  const problema = validarPlato(datos);
  if (problema) return { estado: "error", mensaje: problema };

  const { error } = await supabase
    .from("menu_items")
    .update({
      category_id: datos.categoriaId,
      name: datos.nombre,
      description: datos.descripcion || null,
      price: datos.precio,
      image_url: datos.imagen || null,
      model_glb_url: datos.modeloGlb || null,
      model_usdz_url: datos.modeloUsdz || null,
      is_specialty: datos.esEspecialidad,
      is_available: datos.disponible,
    })
    .eq("id", id);

  if (error) return { estado: "error", mensaje: "No pude guardar el plato." };

  refrescar(
    restaurante.slug,
    "/admin/platos",
    `/admin/platos/${id}`,
    "/admin",
  );
  return { estado: "ok", mensaje: "Plato guardado." };
}

/** Pausa o reactiva un plato. Pausado desaparece del menu publico al instante. */
export async function alternarDisponibilidad(id: string, disponible: boolean) {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: disponible })
    .eq("id", id);
  avisarSiFallo(error, "cambiar la disponibilidad");

  refrescar(restaurante.slug, "/admin/platos", "/admin");
}

export async function eliminarPlato(id: string) {
  const { supabase } = await exigirSesion();
  const restaurante = await exigirRestaurante();

  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  avisarSiFallo(error, "eliminar el plato");

  refrescar(restaurante.slug, "/admin/platos", "/admin");
  redirect("/admin/platos");
}

// ------------------------------------------------------- Bienvenida ---

export async function crearRestaurante(
  _anterior: Resultado,
  formData: FormData,
): Promise<Resultado> {
  const { supabase, user } = await exigirSesion();

  const nombre = String(formData.get("nombre") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();

  if (!nombre) return { estado: "error", mensaje: "Ponele un nombre a tu local." };
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      estado: "error",
      mensaje:
        "La direccion web solo admite minusculas, numeros y guiones. Sin espacios ni acentos.",
    };
  }

  const { error } = await supabase.from("restaurants").insert({
    owner_user_id: user.id,
    name: nombre,
    slug,
  });

  if (error) {
    // Hay dos indices unicos en juego y el mensaje tiene que distinguirlos:
    // el del slug es culpa del dato, el del dueno es que ya tiene un local.
    if (error.code === "23505") {
      if (error.message.includes("owner")) {
        return {
          estado: "error",
          mensaje: "Ya tenes un local creado con esta cuenta.",
        };
      }
      return {
        estado: "error",
        mensaje: "Esa direccion web ya esta ocupada. Proba con otra.",
      };
    }
    return { estado: "error", mensaje: "No pude crear el restaurante." };
  }

  redirect("/admin");
}
