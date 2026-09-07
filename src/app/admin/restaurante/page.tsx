import Link from "next/link";
import { QrCode } from "lucide-react";

import { FormularioDeRestaurante } from "@/components/admin/formulario-restaurante";
import { exigirRestaurante } from "@/lib/admin/datos";

export default async function RestaurantePage() {
  const restaurante = await exigirRestaurante();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-tinta text-2xl font-bold">Mi local</h1>
        <p className="text-tinta-suave mt-1 text-sm">
          Lo que ve el cliente en la cabecera del menu.
        </p>
      </div>

      <FormularioDeRestaurante restaurante={restaurante} />

      <div className="border-borde border-t pt-6">
        <Link
          href={`/${restaurante.slug}/qr`}
          target="_blank"
          className="text-tinta inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline"
        >
          <QrCode className="size-4" aria-hidden />
          Ver e imprimir el codigo QR de las mesas
        </Link>
      </div>
    </div>
  );
}
