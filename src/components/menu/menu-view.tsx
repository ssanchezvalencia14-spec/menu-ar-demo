"use client";

import { useEffect, useRef, useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DishCard } from "@/components/menu/dish-card";
import type { Categoria, Restaurante } from "@/types/menu";

/**
 * Menu completo: tabs de categoria arriba (sticky) y grilla de platos abajo.
 *
 * Es cliente por el estado de la tab activa. La navegacion es un solo nivel:
 * elegis categoria, tocas el plato. No hay desplegables ni acordeones.
 */
export function MenuView({
  restaurante,
  categorias,
}: {
  restaurante: Restaurante;
  categorias: Categoria[];
}) {
  const [activa, setActiva] = useState(categorias[0]?.id ?? "");
  const listaRef = useRef<HTMLDivElement>(null);

  // Al cambiar de categoria, traemos la tab elegida al centro de la vista:
  // si no, las ultimas categorias quedan escondidas fuera de pantalla.
  useEffect(() => {
    const seleccionada = listaRef.current?.querySelector<HTMLElement>(
      '[data-state="active"]',
    );
    seleccionada?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activa]);

  return (
    <Tabs value={activa} onValueChange={setActiva} className="flex-1">
      <div className="material-barra sticky top-0 z-10">
        <TabsList
          ref={listaRef}
          aria-label="Categorias del menu"
          className="mx-auto max-w-3xl px-5 py-3"
        >
          {categorias.map((categoria) => (
            <TabsTrigger key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {categorias.map((categoria) => (
        <TabsContent
          key={categoria.id}
          value={categoria.id}
          className="mx-auto w-full max-w-3xl px-5 py-6"
        >
          {categoria.platos.length === 0 ? (
            <p className="text-tinta-suave py-12 text-center text-lg">
              Todavia no hay platos en esta categoria.
            </p>
          ) : (
            <ul
              className={
                restaurante.tema.distribucion === "lista"
                  ? "flex flex-col gap-3"
                  : "grid grid-cols-2 gap-4 sm:grid-cols-3"
              }
            >
              {categoria.platos.map((plato, indice) => (
                <li key={plato.id}>
                  <DishCard
                    plato={plato}
                    icono={categoria.icono}
                    restaurante={restaurante}
                    priority={indice < 4}
                    indice={indice}
                  />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
