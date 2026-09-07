"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  LayoutGrid,
  Store,
  UtensilsCrossed,
  LayoutDashboard,
} from "lucide-react";

import { cn } from "@/lib/utils";

const SECCIONES = [
  { href: "/admin", etiqueta: "Resumen", icono: LayoutDashboard },
  { href: "/admin/platos", etiqueta: "Platos", icono: UtensilsCrossed },
  { href: "/admin/secciones", etiqueta: "Secciones", icono: LayoutGrid },
  { href: "/admin/horarios", etiqueta: "Horarios", icono: Clock },
  { href: "/admin/restaurante", etiqueta: "Mi local", icono: Store },
];

/**
 * Navegacion del panel. Abajo en el celular (a la altura del pulgar) y como
 * barra lateral en pantallas grandes. Sin menus desplegables: las cinco
 * secciones estan siempre a la vista.
 */
export function NavegacionDelPanel() {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Secciones del panel"
      className="border-borde bg-superficie fixed inset-x-0 bottom-0 z-20 border-t md:static md:w-56 md:shrink-0 md:border-t-0 md:border-r md:py-4"
    >
      <ul className="flex md:flex-col md:gap-1 md:px-3">
        {SECCIONES.map(({ href, etiqueta, icono: Icono }) => {
          const activa =
            href === "/admin" ? ruta === "/admin" : ruta.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-xs font-semibold transition-colors",
                  "md:flex-row md:gap-3 md:rounded-lg md:px-3 md:text-sm",
                  activa
                    ? "text-tinta md:bg-lienzo"
                    : "text-tinta-tenue md:hover:bg-lienzo",
                )}
              >
                <Icono className="size-5 shrink-0" aria-hidden />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
