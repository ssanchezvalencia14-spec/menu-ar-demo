import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FormularioDePlato } from "@/components/admin/formulario-plato";
import { exigirRestaurante, getCategoriasAdmin } from "@/lib/admin/datos";

export default async function NuevoPlatoPage() {
  const restaurante = await exigirRestaurante();
  const categorias = await getCategoriasAdmin(restaurante.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Link
        href="/admin/platos"
        className="text-tinta-suave -ml-2 inline-flex w-fit items-center gap-1.5 px-2 py-1 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Volver a platos
      </Link>

      <h1 className="text-tinta text-2xl font-bold">Nuevo plato</h1>

      <FormularioDePlato
        categorias={categorias}
        restauranteId={restaurante.id}
        moneda={restaurante.moneda}
        locale={restaurante.locale}
      />
    </div>
  );
}
