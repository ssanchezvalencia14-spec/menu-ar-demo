import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ArViewer } from "@/components/plato/ar-viewer";
import { CalificacionDetallada } from "@/components/resenas/estrellas";
import { FormularioResena } from "@/components/resenas/formulario-resena";
import { formatPrecio } from "@/lib/format";
import type { Categoria, Plato, Restaurante } from "@/types/menu";

export function DishDetail({
  plato,
  categoria,
  restaurante,
}: {
  plato: Plato;
  categoria: Categoria;
  restaurante: Restaurante;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 pt-4 pb-12">
      <Link
        href={`/${restaurante.slug}`}
        className="text-tinta-suave -ml-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-2 text-base font-semibold"
      >
        <ArrowLeft className="size-5" aria-hidden />
        Volver al menu
      </Link>

      {/* El visor y su unico boton. Todo lo de abajo es informativo. */}
      <ArViewer plato={plato} icono={categoria.icono} />

      <div className="flex flex-col gap-3">
        {plato.destacado && (
          <Badge variant="destacado" size="md" className="w-fit">
            <Star className="fill-current" aria-hidden />
            Especialidad de la casa
          </Badge>
        )}

        <h1 className="text-tinta text-3xl leading-tight font-bold text-balance">
          {plato.nombre}
        </h1>

        <p className="text-tinta-suave text-lg leading-relaxed">
          {plato.descripcion}
        </p>

        <p className="text-tinta text-3xl font-bold tabular-nums">
          {formatPrecio(plato.precio, restaurante.moneda, restaurante.locale)}
        </p>
      </div>

      <hr className="border-borde" />

      <section className="flex flex-col gap-5">
        <h2 className="text-tinta text-xl font-bold">Opiniones</h2>
        <CalificacionDetallada calificacion={plato.calificacion} />
        <FormularioResena platoId={plato.id} slug={restaurante.slug} />
      </section>
    </div>
  );
}
