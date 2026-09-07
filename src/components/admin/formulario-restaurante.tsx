"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  AreaDeTexto,
  Aviso,
  Campo,
  Entrada,
  Selector,
} from "@/components/admin/campos";
import { SubirArchivo } from "@/components/admin/subir-archivo";
import { guardarRestaurante } from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";
import type { RestauranteAdmin } from "@/lib/admin/datos";

/** Las zonas de America Latina, que es donde vive el producto hoy. */
const ZONAS = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Caracas",
  "America/Guayaquil",
  "America/La_Paz",
  "America/Asuncion",
  "America/Panama",
  "America/Costa_Rica",
  "America/Guatemala",
  "America/Santo_Domingo",
  "Europe/Madrid",
];

export function FormularioDeRestaurante({
  restaurante,
}: {
  restaurante: RestauranteAdmin;
}) {
  const [resultado, enviar, enviando] = useActionState(
    guardarRestaurante,
    RESULTADO_INICIAL,
  );
  const [slug, setSlug] = useState(restaurante.slug);

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <Campo etiqueta="Nombre del local">
        <Entrada
          name="nombre"
          defaultValue={restaurante.nombre}
          required
          maxLength={80}
        />
      </Campo>

      <Campo
        etiqueta="Direccion web de tu menu"
        ayuda={
          <>
            Tu menu vive en{" "}
            <span className="text-tinta font-semibold">/{slug || "..."}</span>.
            Si la cambias, los codigos QR que ya imprimiste dejan de funcionar.
          </>
        }
      >
        <Entrada
          name="slug"
          value={slug}
          onChange={(e) =>
            setSlug(
              e.target.value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .replace(/[^a-z0-9-]/g, "-"),
            )
          }
          required
          maxLength={60}
        />
      </Campo>

      <Campo
        etiqueta="Descripcion corta"
        ayuda="Una linea. Ej: Cocina casera desde 1998."
      >
        <AreaDeTexto
          name="descripcion"
          defaultValue={restaurante.descripcion}
          rows={2}
          maxLength={160}
        />
      </Campo>

      <Campo etiqueta="Direccion" ayuda="Se muestra debajo del nombre en el menu.">
        <Entrada
          name="direccion"
          defaultValue={restaurante.direccion ?? ""}
          maxLength={160}
        />
      </Campo>

      <SubirArchivo
        nombreDelCampo="logo"
        etiqueta="Logo"
        ayuda="Cuadrado queda mejor. Si no cargas ninguno, se usa la inicial del nombre."
        extensiones={[".jpg", ".jpeg", ".png", ".webp", ".svg"]}
        carpeta="marca"
        restauranteId={restaurante.id}
        valorInicial={restaurante.logo}
      />

      <Campo
        etiqueta="Zona horaria"
        ayuda="Define contra que reloj se calcula si estas abierto o cerrado."
      >
        <Selector name="zonaHoraria" defaultValue={restaurante.zonaHoraria}>
          {ZONAS.map((zona) => (
            <option key={zona} value={zona}>
              {zona.split("/").pop()?.replace(/_/g, " ")} ({zona})
            </option>
          ))}
        </Selector>
      </Campo>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}
      {resultado.estado === "ok" && resultado.mensaje && (
        <Aviso tipo="ok">{resultado.mensaje}</Aviso>
      )}

      <Button type="submit" size="lg" disabled={enviando} className="w-fit">
        {enviando ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
