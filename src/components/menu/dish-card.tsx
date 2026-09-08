import Link from "next/link";
import { Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { DishImage } from "@/components/menu/dish-image";
import { CalificacionCompacta } from "@/components/resenas/estrellas";
import { cn } from "@/lib/utils";
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
  indice = 0,
}: {
  plato: Plato;
  icono: CategoriaIcono;
  restaurante: Restaurante;
  priority?: boolean;
  /** Posicion en la grilla: escalona la entrada. */
  indice?: number;
}) {
  return (
    <Link
      href={`/${restaurante.slug}/plato/${plato.id}`}
      className="animar-entrada block h-full rounded-card"
      // Cada card entra un pelin despues que la anterior. El tope de 6 evita
      // que en una carta larga el ultimo plato se haga esperar: con 40 ms de
      // paso, la grilla entera termina de entrar a los 500 ms.
      style={{ animationDelay: `${Math.min(indice, 6) * 40}ms` }}
    >
      <Card
        className={cn(
          "flex h-full flex-col",
          // 180 ms: se siente instantaneo pero no seco. Solo transform y
          // sombra, que no obligan al navegador a recalcular el layout.
          "transition-[transform,box-shadow] duration-[180ms] ease-out",
          "hover:shadow-lg active:shadow-sm",
          // Los efectos de transform solo cuando no se pidio menos movimiento.
          "motion-safe:hover:-translate-y-0.5 motion-safe:active:scale-[0.98]",
        )}
      >
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
