import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { FormularioDePlato } from "@/components/admin/formulario-plato";
import {
  exigirRestaurante,
  getCategoriasAdmin,
  getPlatoAdmin,
} from "@/lib/admin/datos";

export default async function EditarPlatoPage({
  params,
}: PageProps<"/admin/platos/[id]">) {
  const { id } = await params;
  const restaurante = await exigirRestaurante();

  // Si el plato no es de este restaurante, RLS lo devuelve vacio y esto es 404.
  const plato = await getPlatoAdmin(id);
  if (!plato) notFound();

  const categorias = await getCategoriasAdmin(restaurante.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/platos"
          className="text-tinta-suave -ml-2 inline-flex items-center gap-1.5 px-2 py-1 text-sm font-semibold"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Volver a platos
        </Link>

        {plato.disponible && (
          <Link
            href={`/${restaurante.slug}/plato/${plato.id}`}
            target="_blank"
            className="text-tinta-tenue inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
          >
            Ver como lo ve el cliente
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        )}
      </div>

      <h1 className="text-tinta text-2xl font-bold">{plato.nombre}</h1>

      <FormularioDePlato
        plato={plato}
        categorias={categorias}
        restauranteId={restaurante.id}
        moneda={restaurante.moneda}
      />
    </div>
  );
}
