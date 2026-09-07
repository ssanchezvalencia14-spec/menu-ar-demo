import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ListaDePlatos } from "@/components/admin/lista-platos";
import { exigirRestaurante, getPlatosAdmin } from "@/lib/admin/datos";

export default async function PlatosPage() {
  const restaurante = await exigirRestaurante();
  const platos = await getPlatosAdmin(restaurante.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-tinta text-2xl font-bold">Platos</h1>
          <p className="text-tinta-suave mt-1 text-sm">
            {platos.length === 0
              ? "Todavia no cargaste ninguno."
              : "Aca ves todos, incluidos los pausados. Los pausados no aparecen en el menu del cliente."}
          </p>
        </div>
        <Button asChild size="md">
          <Link href="/admin/platos/nuevo">
            <Plus aria-hidden />
            Agregar plato
          </Link>
        </Button>
      </div>

      {platos.length === 0 ? (
        <p className="border-borde text-tinta-suave rounded-card border border-dashed p-8 text-center text-sm">
          Cuando cargues tu primer plato va a aparecer aca y en tu menu publico
          al instante.
        </p>
      ) : (
        <ListaDePlatos
          platos={platos}
          moneda={restaurante.moneda}
          locale={restaurante.locale}
        />
      )}
    </div>
  );
}
