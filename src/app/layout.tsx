import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Menu virtual con Realidad Aumentada",
  description:
    "Menu digital para restaurantes: mira cada plato en tamano real sobre tu mesa, sin instalar ninguna aplicacion.",
};

export const viewport: Viewport = {
  themeColor: "#faf9f7",
  // Sin zoom manual: la tipografia ya es grande y el pellizco compite con el
  // gesto de rotar el modelo 3D.
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
