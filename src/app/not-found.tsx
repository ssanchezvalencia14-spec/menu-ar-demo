import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-tinta text-3xl font-bold text-balance">
        No encontramos esta pagina
      </h1>
      <p className="text-tinta-suave max-w-sm text-lg">
        Puede que el plato ya no este en la carta.
      </p>
      <Button asChild size="lg" variant="primary">
        <Link href="/">Ver el menu</Link>
      </Button>
    </main>
  );
}
