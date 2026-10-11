import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";

import { MenuView } from "@/components/menu/menu-view";
import { RankingSemanal } from "@/components/menu/ranking-semanal";
import { RestaurantHeader } from "@/components/menu/restaurant-header";
import { getMenu } from "@/lib/menu";
import { variablesDelTema } from "@/lib/tema";

export async function generateMetadata({
  params,
}: PageProps<"/[restaurante]">): Promise<Metadata> {
  const { restaurante: slug } = await params;
  const restaurante = await getMenu(slug);
  if (!restaurante) return {};

  return {
    title: `${restaurante.nombre} | Menu`,
    description: `${restaurante.descripcion}. Mira cada plato en tu mesa con realidad aumentada.`,
  };
}

export default async function MenuPage({
  params,
}: PageProps<"/[restaurante]">) {
  const { restaurante: slug } = await params;
  const restaurante = await getMenu(slug);
  if (!restaurante) notFound();

  return (
    /* El tema se inyecta como variables CSS en un contenedor y NO en :root.
       El mismo servidor sirve a todos los restaurantes: si se tocara algo
       global, el acento de un local se filtraria al de otro al navegar. */
    <div style={variablesDelTema(restaurante.tema)} className="contents">
      <RestaurantHeader restaurante={restaurante} />

      {/* Fuera del flujo de carga del menu: si la consulta del ranking tarda,
          el cliente ya esta viendo los platos. Sin fallback visible a proposito,
          porque la seccion puede terminar no mostrandose. */}
      <Suspense fallback={null}>
        <RankingSemanal restaurante={restaurante} />
      </Suspense>

      {restaurante.categorias.length === 0 ? (
        /* Un restaurante recien creado no tiene secciones todavia. Sin esto la
           pagina quedaba con el nombre y nada mas, y lo primero que ve un
           cliente nuevo al abrir SU menu es una pantalla en blanco que parece
           rota. */
        <section className="mx-auto w-full max-w-3xl px-5 py-16 text-center">
          <p className="text-tinta text-lg font-semibold">
            Este menu todavia no tiene platos.
          </p>
          <p className="text-tinta-suave mt-1 text-sm">
            Vuelve en un rato: el restaurante lo esta preparando.
          </p>
        </section>
      ) : (
        <MenuView
          restaurante={restaurante}
          categorias={restaurante.categorias}
        />
      )}

      <footer className="mx-auto w-full max-w-3xl px-5 pt-2 pb-10">
        <Link
          href={`/${restaurante.slug}/qr`}
          className="text-tinta-tenue inline-flex items-center gap-2 text-sm"
        >
          <QrCode className="size-4" aria-hidden />
          Codigo QR para las mesas
        </Link>
      </footer>
    </div>
  );
}
