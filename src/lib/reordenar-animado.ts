"use client";

/**
 * Anima el reordenamiento de una lista con la tecnica FLIP.
 *
 * Al subir o bajar una seccion, el servidor devuelve la lista ya reordenada y
 * el navegador la pinta en su lugar nuevo de una. Sin esto el cambio es un
 * salto y no se entiende que fue lo que se movio.
 *
 * FLIP: se anotan las posiciones ANTES del cambio (First), se deja que el
 * navegador pinte el estado nuevo (Last), se calcula la diferencia (Invert) y
 * se anima desde ahi hasta cero (Play). Se anima solo `transform`, que la GPU
 * resuelve sin recalcular el layout: es lo que mantiene la fluidez en un
 * celular de gama media.
 *
 * Son treinta lineas y evitan sumar una libreria de animacion al panel.
 */

const DURACION = 240;

/** Posiciones actuales de los hijos, indexadas por su data-id. */
export function tomarPosiciones(contenedor: HTMLElement | null) {
  const posiciones = new Map<string, number>();
  if (!contenedor) return posiciones;

  for (const hijo of Array.from(contenedor.children)) {
    const id = (hijo as HTMLElement).dataset.id;
    if (id) posiciones.set(id, hijo.getBoundingClientRect().top);
  }
  return posiciones;
}

/** Anima cada hijo desde donde estaba hasta donde quedo. */
export function animarDesde(
  contenedor: HTMLElement | null,
  anteriores: Map<string, number>,
) {
  if (!contenedor || anteriores.size === 0) return;

  // Si la persona pidio menos movimiento, no se anima nada.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  for (const hijo of Array.from(contenedor.children)) {
    const elemento = hijo as HTMLElement;
    const id = elemento.dataset.id;
    if (!id) continue;

    const antes = anteriores.get(id);
    if (antes === undefined) continue;

    const desplazamiento = antes - elemento.getBoundingClientRect().top;
    if (Math.abs(desplazamiento) < 1) continue;

    elemento.animate(
      [
        { transform: `translate3d(0, ${desplazamiento}px, 0)` },
        { transform: "none" },
      ],
      { duration: DURACION, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }
}
