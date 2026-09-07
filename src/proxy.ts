import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca el token de Supabase en cada pedido y protege /admin.
 *
 * Sin esto la sesion expira y el dueno queda deslogueado a mitad de la
 * edicion: los Server Components no pueden escribir cookies, asi que el
 * refresco tiene que pasar por aca.
 */
export async function proxy(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return respuesta;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nuevas) {
        for (const { name, value } of nuevas) {
          request.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request });
        for (const { name, value, options } of nuevas) {
          respuesta.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() valida el token contra Supabase. getSession() solo lee la
  // cookie, que el cliente podria haber falsificado.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ruta = request.nextUrl.pathname;

  if (ruta.startsWith("/admin") && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    // Para volver a donde queria entrar despues de identificarse.
    login.searchParams.set("volver", ruta);
    return NextResponse.redirect(login);
  }

  if (ruta === "/login" && user) {
    const panel = request.nextUrl.clone();
    panel.pathname = "/admin";
    panel.search = "";
    return NextResponse.redirect(panel);
  }

  return respuesta;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
