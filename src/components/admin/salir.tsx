"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { getSupabaseNavegador } from "@/lib/supabase/navegador";

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  return (
    <button
      type="button"
      disabled={saliendo}
      onClick={async () => {
        setSaliendo(true);
        await getSupabaseNavegador().auth.signOut();
        router.refresh();
        router.push("/login");
      }}
      className="text-tinta-tenue hover:text-tinta inline-flex items-center gap-1.5 text-sm font-semibold"
    >
      <LogOut className="size-4" aria-hidden />
      {saliendo ? "Saliendo..." : "Salir"}
    </button>
  );
}
