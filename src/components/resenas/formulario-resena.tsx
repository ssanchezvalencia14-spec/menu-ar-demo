"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dejarResena, type EstadoResena } from "@/lib/actions";
import { cn } from "@/lib/utils";

const ESTADO_INICIAL: EstadoResena = { estado: "inicial" };

/**
 * Formulario publico de resenas. Sin login: se califica y se manda.
 *
 * Deliberadamente discreto. El boton de AR es la accion principal de la
 * pantalla; esto vive mas abajo y usa el estilo secundario para no competir.
 */
export function FormularioResena({
  platoId,
  slug,
}: {
  platoId: string;
  slug: string;
}) {
  const [resultado, enviar, enviando] = useActionState(
    dejarResena,
    ESTADO_INICIAL,
  );
  const [estrellas, setEstrellas] = useState(0);
  const [sobrevolada, setSobrevolada] = useState(0);

  if (resultado.estado === "ok") {
    return (
      <p className="border-borde bg-superficie text-tinta rounded-card border px-4 py-5 text-center text-base font-semibold">
        Gracias por tu resena.
      </p>
    );
  }

  const marcadas = sobrevolada || estrellas;

  return (
    <form action={enviar} className="flex flex-col gap-4">
      <input type="hidden" name="platoId" value={platoId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={estrellas} />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-tinta mb-2 text-base font-semibold">
          Que te parecio este plato?
        </legend>

        <div
          className="flex gap-1"
          onMouseLeave={() => setSobrevolada(0)}
          role="radiogroup"
          aria-label="Calificacion de 1 a 5 estrellas"
        >
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              type="button"
              role="radio"
              aria-checked={estrellas === valor}
              aria-label={`${valor} ${valor === 1 ? "estrella" : "estrellas"}`}
              onClick={() => setEstrellas(valor)}
              onMouseEnter={() => setSobrevolada(valor)}
              className="rounded-full p-1"
            >
              <Star
                className={cn(
                  "size-10 transition-colors",
                  valor <= marcadas
                    ? "text-destacado fill-current"
                    : "text-borde-fuerte fill-current",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-tinta text-base font-semibold">
          Queres agregar algo? <span className="text-tinta-tenue">(opcional)</span>
        </span>
        <textarea
          name="comentario"
          rows={3}
          maxLength={500}
          className="border-borde-fuerte bg-superficie text-tinta rounded-xl border px-4 py-3 text-base"
        />
      </label>

      {resultado.estado === "error" && (
        <p className="text-destacado text-sm font-semibold" role="alert">
          {resultado.mensaje}
        </p>
      )}

      <Button
        type="submit"
        variant="outline"
        size="md"
        disabled={enviando || estrellas === 0}
        className="w-full"
      >
        {enviando ? "Enviando..." : "Enviar resena"}
      </Button>
    </form>
  );
}
