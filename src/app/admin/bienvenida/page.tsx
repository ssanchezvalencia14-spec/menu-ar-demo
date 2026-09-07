import { redirect } from "next/navigation";

import { FormularioDeBienvenida } from "@/app/admin/bienvenida/formulario";
import { getRestauranteDelDueno } from "@/lib/admin/datos";

/**
 * Primer ingreso: el usuario tiene cuenta pero todavia no tiene local.
 * Es la pantalla que hace que puedas dar de alta un cliente nuevo sin tocar
 * la base de datos.
 */
export default async function BienvenidaPage() {
  const restaurante = await getRestauranteDelDueno();
  if (restaurante) redirect("/admin");

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="text-tinta text-2xl font-bold">Creemos tu local</h1>
        <p className="text-tinta-suave mt-1 text-sm">
          Solo dos datos para empezar. Todo lo demas se configura despues.
        </p>
      </div>

      <FormularioDeBienvenida />
    </div>
  );
}
