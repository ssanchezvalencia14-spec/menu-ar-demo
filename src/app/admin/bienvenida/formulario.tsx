"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Aviso, Campo, Entrada } from "@/components/admin/campos";
import { crearRestaurante } from "@/lib/admin/acciones";
import { RESULTADO_INICIAL } from "@/lib/admin/tipos";

/** Convierte "La Parrilla de Juan" en "la-parrilla-de-juan". */
function aSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function FormularioDeBienvenida() {
  const [resultado, enviar, enviando] = useActionState(
    crearRestaurante,
    RESULTADO_INICIAL,
  );
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTocado, setSlugTocado] = useState(false);

  const slugFinal = slugTocado ? slug : aSlug(nombre);

  return (
    <form action={enviar} className="flex flex-col gap-5">
      <Campo etiqueta="Nombre del local">
        <Entrada
          name="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoFocus
          maxLength={80}
        />
      </Campo>

      <Campo
        etiqueta="Direccion web de tu menu"
        ayuda={
          <>
            Tu menu va a vivir en{" "}
            <span className="text-tinta font-semibold">
              /{slugFinal || "tu-local"}
            </span>
          </>
        }
      >
        <Entrada
          name="slug"
          value={slugFinal}
          onChange={(e) => {
            setSlugTocado(true);
            setSlug(aSlug(e.target.value));
          }}
          required
          maxLength={60}
        />
      </Campo>

      {resultado.estado === "error" && (
        <Aviso tipo="error">{resultado.mensaje}</Aviso>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={enviando || !nombre || !slugFinal}
      >
        {enviando ? "Creando..." : "Crear mi local"}
      </Button>
    </form>
  );
}
