/**
 * Puebla la base con el menu inicial.
 *
 *   npm run seed
 *
 * Usa la SERVICE ROLE KEY, no la anon key: las politicas de RLS no permiten
 * insertar restaurantes ni platos desde el navegador, y esta bien que asi sea.
 * Esa clave nunca tiene que llegar al cliente ni al repositorio.
 *
 * Es idempotente: si el restaurante ya existe, borra su contenido y lo vuelve
 * a cargar. Las resenas y las vistas se borran en cascada, asi que correrlo de
 * nuevo despues de la demo borra los datos de prueba.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

import { restauranteInicial } from "./datos-iniciales";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltan variables de entorno.\n" +
      "Necesito NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local\n" +
      "Las dos salen de: Supabase > Project Settings > API",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function seed() {
  const datos = restauranteInicial;

  // 1. Borrar el restaurante anterior. El resto cae por ON DELETE CASCADE.
  const { error: errorBorrado } = await supabase
    .from("restaurants")
    .delete()
    .eq("slug", datos.slug);
  if (errorBorrado) throw errorBorrado;

  // 2. Restaurante.
  const { data: restaurante, error: errorRestaurante } = await supabase
    .from("restaurants")
    .insert({
      slug: datos.slug,
      name: datos.nombre,
      description: datos.descripcion,
      logo_url: datos.logo,
      schedule: datos.horario,
      currency: datos.moneda,
      locale: datos.locale,
    })
    .select("id")
    .single();
  if (errorRestaurante) throw errorRestaurante;

  console.log(`Restaurante "${datos.nombre}" creado (${restaurante.id})`);

  // 3. Categorias y platos, respetando el orden del archivo.
  let totalPlatos = 0;

  for (const [indiceCategoria, categoria] of datos.categorias.entries()) {
    const { data: categoriaCreada, error: errorCategoria } = await supabase
      .from("categories")
      .insert({
        restaurant_id: restaurante.id,
        name: categoria.nombre,
        icon: categoria.icono,
        sort_order: indiceCategoria + 1,
      })
      .select("id")
      .single();
    if (errorCategoria) throw errorCategoria;

    const platos = categoria.platos.map((plato, indicePlato) => ({
      restaurant_id: restaurante.id,
      category_id: categoriaCreada.id,
      name: plato.nombre,
      description: plato.descripcion,
      price: plato.precio,
      image_url: plato.imagen,
      model_glb_url: plato.modeloGlb,
      model_usdz_url: plato.modeloUsdz,
      is_specialty: plato.esEspecialidad,
      is_available: true,
      sort_order: indicePlato + 1,
    }));

    const { error: errorPlatos } = await supabase
      .from("menu_items")
      .insert(platos);
    if (errorPlatos) throw errorPlatos;

    totalPlatos += platos.length;
    console.log(`  ${categoria.nombre}: ${platos.length} platos`);
  }

  console.log(
    `\nListo: ${datos.categorias.length} categorias, ${totalPlatos} platos.`,
  );
  console.log(`Abri http://localhost:3000/${datos.slug}`);
}

seed().catch((error) => {
  console.error("\nEl seed fallo:");
  console.error(error.message ?? error);
  process.exit(1);
});
