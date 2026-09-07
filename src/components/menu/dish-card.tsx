import Link from "next/link";
import { Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { DishImage } from "@/components/menu/dish-image";
import { CalificacionCompacta } from "@/components/resenas/estrellas";
import { formatPrecio } from "@/lib/format";
import type { CategoriaIcono, Plato, Restaurante } from "@/types/menu";

/**
 * Card de plato. La card entera es el area tocable: no hay un boton chiquito
 * adentro que haya que acertar.
 */
export function DishCard({
  plato,
  icono,
  restaurante,
  priority = false,
}: {
  plato: Plato;
  icono: CategoriaIcono;
  restaurante: Restaurante;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/${restaurante.slug}/plato/${plato.id}`}
      className="block h-full rounded-card"
    >
      <Card className="flex h-full flex-col transition-transform active:scale-[0.98]">
        <div className="relative aspect-4/3 w-full shrink-0">
          <DishImage
            plato={plato}
            icono={icono}
            priority={priority}
            sizes="(min-width: 640px) 33vw, 50vw"
          />
          {plato.destacado && (
            <span
              className="bg-superficie text-destacado absolute top-2 left-2 flex size-8 items-center justify-center rounded-full shadow-sm"
              title="Especialidad de la casa"
            >
              <Star className="size-4 fill-current" />
              <span className="sr-only">Especialidad de la casa</span>
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="text-tinta flex-1 text-lg leading-tight font-semibold text-balance">
            {plato.nombre}
          </h3>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-tinta text-xl font-bold tabular-nums">
              {formatPrecio(
                plato.precio,
                restaurante.moneda,
                restaurante.locale,
              )}
            </p>
            <CalificacionCompacta calificacion={plato.calificacion} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
