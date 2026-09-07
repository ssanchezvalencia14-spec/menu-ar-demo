import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

import { FormularioDeIngreso } from "@/app/login/formulario";

export const metadata: Metadata = {
  title: "Ingresar al panel",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-tinta flex size-14 items-center justify-center rounded-2xl text-white">
          <UtensilsCrossed className="size-7" aria-hidden />
        </span>
        <h1 className="text-tinta text-2xl font-bold">Panel del restaurante</h1>
        <p className="text-tinta-suave text-base">
          Administra tu menu, tus precios y tus horarios.
        </p>
      </div>

      <Suspense fallback={null}>
        <FormularioDeIngreso />
      </Suspense>

      <Link
        href="/"
        className="text-tinta-tenue text-center text-sm underline-offset-4 hover:underline"
      >
        Ver el menu publico
      </Link>
    </main>
  );
}
