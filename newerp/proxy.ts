import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n.routing";

const handleI18nRouting = createMiddleware(routing);

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/verify-code",
  "/reset-password",
];

function getPathWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/(en|ar)/, "") || "/";
}

function getLocale(pathname: string): string {
  return pathname.match(/^\/(en|ar)/)?.[1] ?? routing.defaultLocale;
}

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const locale = getLocale(pathname);
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  const token =
    req.cookies.get("auth_token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  const forceReset = req.cookies.get("force_reset")?.value === "1";

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );

  if (token && forceReset && pathWithoutLocale !== "/change-password") {
    return NextResponse.redirect(new URL(`/${locale}/change-password`, req.url));
  }

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  const guestOnlyPaths = [
    "/login",
    "/forgot-password",
    "/verify-code",
    "/reset-password",
  ];
  if (
    token &&
    !forceReset &&
    guestOnlyPaths.some(
      (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
    )
  ) {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  return handleI18nRouting(req);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
