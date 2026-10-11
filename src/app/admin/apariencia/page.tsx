import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { FormularioDeApariencia } from "@/components/admin/formulario-apariencia";
import { exigirRestaurante } from "@/lib/admin/datos";

export default async function AparienciaPage() {
  const restaurante = await exigirRestaurante();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-tinta text-2xl font-bold">Apariencia</h1>
        <p className="text-tinta-suave mt-1 text-sm">
          Como se ve tu menu. Los cambios se aplican al instante, sin publicar.
        </p>
      </div>

      <FormularioDeApariencia tema={restaurante.tema} />

      <div className="border-borde border-t pt-6">
        <Link
          href={`/${restaurante.slug}`}
          target="_blank"
          className="text-tinta inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
        >
          <ExternalLink className="size-4" aria-hidden />
          Abrir mi menu para verlo
        </Link>
      </div>
    </div>
  );
}
