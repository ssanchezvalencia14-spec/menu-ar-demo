import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Calificacion } from "@/types/menu";

/**
 * Cinco estrellas con relleno parcial segun el promedio.
 * Solo lectura: para calificar esta el formulario.
 */
export function Estrellas({
  promedio,
  className,
}: {
  promedio: number;
  className?: string;
}) {
  const porcentaje = Math.max(0, Math.min(100, (promedio / 5) * 100));

  return (
    <span
      className={cn("relative inline-flex shrink-0", className)}
      aria-hidden
    >
      {/* Capa gris de fondo. */}
      <span className="text-borde-fuerte flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-4 fill-current" />
        ))}
      </span>
      {/* Capa dorada recortada al promedio. */}
      <span
        className="text-destacado absolute inset-0 flex overflow-hidden"
        style={{ width: `${porcentaje}%` }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className="size-4 shrink-0 fill-current" />
        ))}
      </span>
    </span>
  );
}

/**
 * Calificacion compacta para las cards del grid: una estrella y el numero.
 * No se muestra nada si el plato todavia no tiene resenas, para no llenar el
 * menu de ceros el primer dia.
 */
export function CalificacionCompacta({
  calificacion,
  className,
}: {
  calificacion: Calificacion;
  className?: string;
}) {
  if (calificacion.cantidad === 0) return null;

  return (
    <span
      className={cn(
        "text-tinta-suave inline-flex items-center gap-1 text-sm font-semibold",
        className,
      )}
    >
      <Star className="text-destacado size-4 fill-current" aria-hidden />
      <span className="tabular-nums">
        {calificacion.promedio.toFixed(1)}
      </span>
      <span className="sr-only">
        de 5, {calificacion.cantidad}{" "}
        {calificacion.cantidad === 1 ? "resena" : "resenas"}
      </span>
    </span>
  );
}

/** Promedio, estrellas y cantidad de resenas. Para la vista de detalle. */
export function CalificacionDetallada({
  calificacion,
}: {
  calificacion: Calificacion;
}) {
  if (calificacion.cantidad === 0) {
    return (
      <p className="text-tinta-suave text-base">
        Todavia no hay resenas de este plato.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-tinta text-2xl font-bold tabular-nums">
        {calificacion.promedio.toFixed(1)}
      </span>
      <Estrellas promedio={calificacion.promedio} />
      <span className="text-tinta-suave text-base">
        {calificacion.cantidad}{" "}
        {calificacion.cantidad === 1 ? "resena" : "resenas"}
      </span>
    </div>
  );
}
