"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Copy, Pencil, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Entrada } from "@/components/admin/campos";

/**
 * El link publico del menu.
 *
 * Antes esto era un campo de texto con la palabra "slug" disfrazada de
 * "direccion web", y nadie entendia que hacia. Ahora se muestra el link
 * completo, se puede copiar de un toque, y cambiarlo esta escondido detras de
 * un boton con la advertencia de que rompe los QR ya impresos.
 */

const suscribirse = () => () => {};
const origenDelNavegador = () => window.location.origin;
const origenEnElServidor = () => "";

/** "La Parrilla de Juan" -> "la-parrilla-de-juan" */
function aSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CampoDelLink({
  name,
  slugInicial,
}: {
  name: string;
  slugInicial: string;
}) {
  const origen = useSyncExternalStore(
    suscribirse,
    origenDelNavegador,
    origenEnElServidor,
  );
  const [slug, setSlug] = useState(slugInicial);
  const [editando, setEditando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const linkCompleto = `${origen}/${slug}`;
  const linkVisible = linkCompleto.replace(/^https?:\/\//, "");

  return (
    <div className="flex flex-col gap-2">
      <span className="text-tinta text-sm font-semibold">
        El link de tu menu
      </span>

      <input type="hidden" name={name} value={slug} />

      <div className="border-borde bg-superficie flex items-center gap-2 rounded-lg border p-3">
        <span className="text-tinta min-w-0 flex-1 truncate text-sm font-semibold">
          {origen ? linkVisible : `.../${slug}`}
        </span>

        <Button
          type="button"
          variant="outline"
          size="md"
          disabled={!origen}
          onClick={async () => {
            await navigator.clipboard.writeText(linkCompleto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          }}
        >
          {copiado ? (
            <>
              <Check aria-hidden />
              Copiado
            </>
          ) : (
            <>
              <Copy aria-hidden />
              Copiar
            </>
          )}
        </Button>
      </div>

      <p className="text-tinta-tenue text-xs">
        Es la direccion que abren tus clientes al escanear el codigo QR de las
        mesas.
      </p>

      {editando ? (
        <div className="border-destacado bg-destacado-fondo mt-1 flex flex-col gap-3 rounded-lg border p-3">
          <p className="text-tinta flex items-start gap-2 text-xs font-semibold">
            <TriangleAlert
              className="text-destacado mt-0.5 size-4 shrink-0"
              aria-hidden
            />
            <span>
              Si cambias esto, los codigos QR que ya imprimiste y pegaste en las
              mesas dejan de funcionar. Habria que imprimirlos de nuevo.
            </span>
          </p>

          <Entrada
            value={slug}
            onChange={(e) => setSlug(aSlug(e.target.value))}
            aria-label="Ultima parte del link"
            maxLength={60}
            autoFocus
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setSlug(slugInicial);
                setEditando(false);
              }}
            >
              Dejarlo como estaba
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-tinta-tenue hover:text-tinta inline-flex w-fit items-center gap-1 text-xs underline-offset-4 hover:underline"
        >
          <Pencil className="size-3" aria-hidden />
          Cambiar el link
        </button>
      )}
    </div>
  );
}
