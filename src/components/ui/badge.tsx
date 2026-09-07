import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-semibold [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        destacado: "bg-destacado-fondo text-destacado",
        neutro: "bg-lienzo text-tinta-suave",
        oscuro: "bg-tinta text-white",
      },
      size: {
        sm: "px-2.5 py-1 text-xs [&_svg]:size-3.5",
        md: "px-3.5 py-1.5 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "neutro", size: "sm" },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
