import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { NavegacionDelPanel } from "@/components/admin/navegacion";
import { BotonSalir } from "@/components/admin/salir";
import { getRestauranteDelDueno } from "@/lib/admin/datos";

export const metadata: Metadata = {
  title: "Panel del restaurante",
  robots: { index: false },
};

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  // El middleware ya garantizo que hay sesion. Esto es solo para el encabezado.
  const restaurante = await getRestauranteDelDueno();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-borde bg-superficie flex items-center justify-between gap-4 border-b px-5 py-3">
        <div className="min-w-0">
          <p className="text-tinta truncate text-base font-bold">
            {restaurante?.nombre ?? "Panel"}
          </p>
          {restaurante && (
            <Link
              href={`/${restaurante.slug}`}
              target="_blank"
              className="text-tinta-tenue inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
            >
              Ver mi menu publico
              <ExternalLink className="size-3" aria-hidden />
            </Link>
          )}
        </div>
        <BotonSalir />
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <NavegacionDelPanel />
        {/* pb-24 deja lugar a la barra inferior del celular. */}
        <main className="flex-1 px-5 py-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}
