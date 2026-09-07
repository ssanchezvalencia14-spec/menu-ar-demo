import Image from "next/image";
import { Clock } from "lucide-react";

import type { Restaurante } from "@/types/menu";

/**
 * Cabecera del menu: quien es, cuando abre. Nada mas.
 * Sin foto se usa un monograma con la inicial del nombre.
 */
export function RestaurantHeader({
  restaurante,
}: {
  restaurante: Restaurante;
}) {
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
          <p className="text-tinta-suave mt-1.5 flex items-center gap-1.5 text-sm">
            <Clock className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{restaurante.horario}</span>
          </p>
        </div>
      </div>
    </header>
  );
}
