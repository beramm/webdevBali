import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { SESSION_COOKIE, verifySessionToken } from "./lib/auth/session";

const intl = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    const session = await verifySessionToken(
      request.cookies.get(SESSION_COOKIE)?.value
    );
    const isLoginPage = pathname === "/admin/login";

    if (!session && !isLoginPage) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (session && isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  return intl(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
