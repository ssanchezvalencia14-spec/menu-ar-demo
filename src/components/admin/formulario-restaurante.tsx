"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  AreaDeTexto,
  Aviso,
  Campo,
  Entrada,
  Selector,
} from "@/components/admin/campos";
import { CampoDelLink } from "@/components/admin/campo-link";
import { SubirArchivo } from "@/components/admin/subir-archivo";
import { guardarRestaurante } from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";
import { ZONAS } from "@/lib/zonas";
import type { RestauranteAdmin } from "@/lib/admin/datos";


export function FormularioDeRestaurante({
  restaurante,
}: {
  restaurante: RestauranteAdmin;
}) {
  const [resultado, enviar, enviando] = useActionState(
    guardarRestaurante,
    RESULTADO_INICIAL,
  );

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

      <CampoDelLink name="slug" slugInicial={restaurante.slug} />

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
        // Sin .svg: un svg puede llevar script adentro y el bucket es publico.
        extensiones={[".jpg", ".jpeg", ".png", ".webp"]}
        carpeta="marca"
        restauranteId={restaurante.id}
        valorInicial={restaurante.logo}
        esImagen
      />

      <Campo
        etiqueta="Pais de tu local"
        ayuda="Se usa para saber la hora local y mostrar si estas abierto o cerrado."
      >
        <Selector name="zonaHoraria" defaultValue={restaurante.zonaHoraria}>
          {ZONAS.map((zona) => (
            <option key={zona.valor} value={zona.valor}>
              {zona.etiqueta}
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
