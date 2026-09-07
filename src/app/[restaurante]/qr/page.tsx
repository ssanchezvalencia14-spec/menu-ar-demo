import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { QrPoster } from "@/components/qr/qr-poster";
import { getMenu } from "@/lib/menu";

export const metadata: Metadata = {
  title: "Codigo QR para las mesas",
  robots: { index: false },
};

export default async function QrPage({
  params,
}: PageProps<"/[restaurante]/qr">) {
  const { restaurante: slug } = await params;
  const restaurante = await getMenu(slug);
  if (!restaurante) notFound();

  return (
    <main className="flex-1 px-5 pt-4 pb-12">
      <Link
        href={`/${restaurante.slug}`}
        className="text-tinta-suave -ml-2 mb-6 inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-2 text-base font-semibold print:hidden"
      >
        <ArrowLeft className="size-5" aria-hidden />
        Volver al menu
      </Link>

      <QrPoster restaurante={restaurante} />
    </main>
  );
}
