import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DishDetail } from "@/components/plato/dish-detail";
import { getPlato } from "@/lib/menu";

export async function generateMetadata({
  params,
}: PageProps<"/[restaurante]/plato/[id]">): Promise<Metadata> {
  const { restaurante: slug, id } = await params;
  const resultado = await getPlato(slug, id);
  if (!resultado) return {};

  return {
    title: `${resultado.plato.nombre} | ${resultado.restaurante.nombre}`,
    description: resultado.plato.descripcion,
  };
}

export default async function PlatoPage({
  params,
}: PageProps<"/[restaurante]/plato/[id]">) {
  const { restaurante: slug, id } = await params;
  const resultado = await getPlato(slug, id);
  if (!resultado) notFound();

  return (
    <main className="flex-1">
      <DishDetail
        plato={resultado.plato}
        categoria={resultado.categoria}
        restaurante={resultado.restaurante}
      />
    </main>
  );
}
