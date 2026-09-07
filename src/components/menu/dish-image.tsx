import Image from "next/image";
import { CakeSlice, CupSoda, Soup, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CategoriaIcono, Plato } from "@/types/menu";

const ICONO_POR_CATEGORIA = {
  entrada: Soup,
  principal: UtensilsCrossed,
  postre: CakeSlice,
  bebida: CupSoda,
} as const;

/**
 * Foto del plato.
 *
 * Mientras el restaurante no cargue su foto (`plato.imagen === null`) dibujamos
 * un placeholder disenado, no un hueco: icono de la categoria sobre un tono
 * derivado del nombre del plato, para que dos cards vecinas no se vean iguales.
 */
export function DishImage({
  plato,
  icono,
  sizes,
  priority = false,
  className,
}: {
  plato: Plato;
  icono: CategoriaIcono;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (plato.imagen) {
    return (
      <Image
        src={plato.imagen}
        alt={plato.nombre}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", className)}
      />
    );
  }

  const Icono = ICONO_POR_CATEGORIA[icono];
  // Tono estable por plato: mismo nombre, mismo color en cada render.
  const matiz =
    [...plato.nombre].reduce((suma, letra) => suma + letra.charCodeAt(0), 0) %
    360;

  return (
    <div
      aria-hidden
      className={cn(
        "flex h-full w-full items-center justify-center",
        className,
      )}
      style={{
        background: `linear-gradient(145deg, hsl(${matiz} 22% 95%), hsl(${(matiz + 40) % 360} 18% 89%))`,
      }}
    >
      <Icono
        className="size-1/3 max-h-20 min-h-8 opacity-30"
        strokeWidth={1.25}
        style={{ color: `hsl(${matiz} 30% 32%)` }}
      />
    </div>
  );
}
