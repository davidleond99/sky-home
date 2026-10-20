import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Redirección optimista: si no hay cookie de sesión, al login.
 * NO es la comprobación de seguridad: cada página/acción valida la sesión en servidor.
 */
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const loginUrl = new URL("/login", request.url);
    const { pathname, search } = request.nextUrl;
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // Todo excepto login, la API de auth y los estáticos.
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
