"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "ocultar-scrollbar flex gap-2 overflow-x-auto scroll-smooth",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "border-borde text-tinta-suave shrink-0 rounded-full border px-5 py-3 text-base font-semibold whitespace-nowrap",
        "transition-[background-color,border-color,color,transform] duration-200 ease-out motion-safe:active:scale-95",
        "data-[state=active]:bg-tinta data-[state=active]:border-tinta data-[state=active]:text-white",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      // Radix desmonta el panel inactivo, asi que no hay salida que animar:
      // basta con que el panel nuevo entre con un fundido para que el cambio
      // de categoria no se sienta como un salto.
      className={cn("animar-aparecer outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
