import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * El hundimiento al presionar es CSS puro, sobre el propio boton.
 *
 * No es un detalle de estilo: el boton "Ver en tu mesa" llama a activateAR(),
 * que los navegadores moviles solo permiten dentro del gesto real del usuario.
 * Envolverlo en un componente de animacion que intercepte o difiera el click
 * romperia el AR en iPhone. Con una transicion de CSS eso no puede pasar.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold",
    "transition-[background-color,color,transform,box-shadow] duration-150 ease-out",
    "motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Accion principal. Solo hay una por pantalla.
        primary: "bg-tinta text-white active:bg-tinta-suave",
        outline:
          "border border-borde-fuerte bg-superficie text-tinta active:bg-lienzo",
        ghost: "text-tinta-suave active:bg-lienzo",
      },
      size: {
        // Alto generoso: se toca con el pulgar, de pie, en una mesa.
        lg: "h-16 px-8 text-lg [&_svg]:size-6",
        md: "h-12 px-5 text-base [&_svg]:size-5",
        icon: "size-12 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
