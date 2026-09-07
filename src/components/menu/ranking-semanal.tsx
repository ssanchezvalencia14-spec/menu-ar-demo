import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { DishImage } from "@/components/menu/dish-image";
import { getIconoDePlato, getMasMiradosDeLaSemana } from "@/lib/menu";
import { formatPrecio } from "@/lib/format";
import type { Restaurante } from "@/types/menu";

/**
 * "Los mas mirados esta semana".
 *
 * Componente asincronico: se renderiza dentro de un <Suspense> para que el
 * menu se vea completo sin esperar esta consulta.
 *
 * Mide toques en "Ver en tu mesa", no pedidos reales: no hay integracion con
 * el punto de venta del restaurante. Por eso dice "mirados" y no "pedidos".
 */
export async function RankingSemanal({
  restaurante,
}: {
  restaurante: Restaurante;
}) {
  const top = await getMasMiradosDeLaSemana(restaurante);

  // Sin datos suficientes no se muestra nada: un ranking de un plato no es
  // un ranking, y un restaurante nuevo no deberia estrenar una seccion vacia.
  if (top.length === 0) return null;

  return (
    <section className="border-borde border-b px-5 py-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-tinta mb-4 flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="size-5" aria-hidden />
          Los mas mirados esta semana
        </h2>

        <ol className="flex flex-col gap-2">
          {top.map(({ plato }, indice) => (
            <li key={plato.id}>
              <Link
                href={`/${restaurante.slug}/plato/${plato.id}`}
                className="border-borde bg-superficie flex items-center gap-3 rounded-card border p-2 transition-transform active:scale-[0.99]"
              >
                <span
                  aria-hidden
                  className="text-tinta-tenue w-5 shrink-0 text-center text-lg font-bold tabular-nums"
                >
                  {indice + 1}
                </span>

                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                  <DishImage
                    plato={plato}
                    icono={getIconoDePlato(restaurante, plato.id)}
                    sizes="56px"
                  />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="text-tinta block truncate text-base font-semibold">
                    {plato.nombre}
                  </span>
                  <span className="text-tinta-suave block text-sm tabular-nums">
                    {formatPrecio(
                      plato.precio,
                      restaurante.moneda,
                      restaurante.locale,
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
