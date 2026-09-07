"use client";

import { useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, ImageOff, Pencil, Star } from "lucide-react";

import { alternarDisponibilidad } from "@/lib/admin/acciones";
import { formatPrecio } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PlatoAdmin } from "@/lib/admin/datos";

/**
 * Inventario de platos. A diferencia del menu publico, aca se ven tambien los
 * pausados: es la lista del dueno, no la carta del cliente.
 */
export function ListaDePlatos({
  platos,
  moneda,
  locale,
}: {
  platos: PlatoAdmin[];
  moneda: string;
  locale: string;
}) {
  // Agrupados por seccion, en el mismo orden que el menu publico.
  const porSeccion = platos.reduce<Record<string, PlatoAdmin[]>>(
    (grupos, plato) => {
      (grupos[plato.categoriaNombre] ??= []).push(plato);
      return grupos;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-6">
      {Object.entries(porSeccion).map(([seccion, delGrupo]) => (
        <section key={seccion} className="flex flex-col gap-2">
          <h2 className="text-tinta-suave text-xs font-bold tracking-wide uppercase">
            {seccion}
          </h2>
          <ul className="flex flex-col gap-2">
            {delGrupo.map((plato) => (
              <FilaDePlato
                key={plato.id}
                plato={plato}
                moneda={moneda}
                locale={locale}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function FilaDePlato({
  plato,
  moneda,
  locale,
}: {
  plato: PlatoAdmin;
  moneda: string;
  locale: string;
}) {
  const [cambiando, cambiar] = useTransition();
  const tieneModeloCompleto = Boolean(plato.modeloGlb && plato.modeloUsdz);

  return (
    <li
      className={cn(
        "border-borde bg-superficie flex items-center gap-3 rounded-card border p-3",
        !plato.disponible && "opacity-60",
      )}
    >
      <span className="bg-lienzo relative size-14 shrink-0 overflow-hidden rounded-lg">
        {plato.imagen ? (
          <Image
            src={plato.imagen}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <span className="text-tinta-tenue flex h-full items-center justify-center">
            <ImageOff className="size-5" aria-hidden />
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-tinta flex items-center gap-1.5 truncate text-base font-semibold">
          {plato.esEspecialidad && (
            <Star
              className="text-destacado size-4 shrink-0 fill-current"
              aria-label="Especialidad de la casa"
            />
          )}
          {plato.nombre}
        </p>
        <p className="text-tinta-suave text-sm tabular-nums">
          {formatPrecio(plato.precio, moneda, locale)}
        </p>
        {!tieneModeloCompleto && (
          <p className="text-tinta-tenue mt-0.5 flex items-center gap-1 text-xs">
            <Box className="size-3" aria-hidden />
            {plato.modeloGlb || plato.modeloUsdz
              ? "Falta un formato 3D"
              : "Sin modelo 3D"}
          </p>
        )}
      </div>

      {/* Pausar es la accion mas frecuente del dia a dia: se agoto un plato y
          hay que sacarlo ya. Por eso va en la lista y no adentro del formulario. */}
      <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1">
        <input
          type="checkbox"
          checked={plato.disponible}
          disabled={cambiando}
          onChange={(e) =>
            cambiar(() =>
              void alternarDisponibilidad(plato.id, e.target.checked),
            )
          }
          className="accent-tinta size-5"
        />
        <span className="text-tinta-tenue text-[10px] font-semibold">
          {plato.disponible ? "Activo" : "Pausado"}
        </span>
      </label>

      <Link
        href={`/admin/platos/${plato.id}`}
        aria-label={`Editar ${plato.nombre}`}
        className="text-tinta-tenue hover:text-tinta shrink-0 p-2"
      >
        <Pencil className="size-5" aria-hidden />
      </Link>
    </li>
  );
}
