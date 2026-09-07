import Image from "next/image";
import { MapPin } from "lucide-react";

import { estadoDeApertura } from "@/lib/horarios";
import { cn } from "@/lib/utils";
import type { Restaurante } from "@/types/menu";

/**
 * Cabecera del menu: quien es, si esta abierto, donde queda.
 *
 * El estado de apertura se calcula en el servidor con la zona horaria del
 * restaurante, no con el reloj del celular del comensal. Sin foto se usa un
 * monograma con la inicial del nombre.
 */
export function RestaurantHeader({
  restaurante,
}: {
  restaurante: Restaurante;
}) {
  const estado = estadoDeApertura(
    restaurante.horarios,
    restaurante.zonaHoraria,
  );

  return (
    <header className="bg-superficie border-borde border-b px-5 pt-8 pb-6">
      <div className="mx-auto flex max-w-3xl items-center gap-4">
        {restaurante.logo ? (
          <Image
            src={restaurante.logo}
            alt=""
            width={64}
            height={64}
            className="border-borde size-16 shrink-0 rounded-full border object-cover"
            unoptimized
          />
        ) : (
          <span
            aria-hidden
            className="bg-tinta flex size-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
          >
            {restaurante.nombre.charAt(0).toUpperCase()}
          </span>
        )}

        <div className="min-w-0">
          <h1 className="text-tinta text-2xl leading-tight font-bold text-balance sm:text-3xl">
            {restaurante.nombre}
          </h1>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm">
            <span
              aria-hidden
              className={cn(
                "size-2 shrink-0 rounded-full",
                estado.abierto ? "bg-emerald-500" : "bg-tinta-tenue",
              )}
            />
            <span
              className={cn(
                "font-semibold",
                estado.abierto ? "text-emerald-700" : "text-tinta-suave",
              )}
            >
              {estado.abierto ? "Abierto" : "Cerrado"}
            </span>
            {estado.detalle && (
              <span className="text-tinta-suave">{estado.detalle}</span>
            )}
          </p>

          {restaurante.direccion && (
            <p className="text-tinta-suave mt-1 flex items-center gap-1.5 text-sm">
              <MapPin className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{restaurante.direccion}</span>
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
