import type { NextRequest } from "next/server";

export const AUTH_TOKEN_COOKIE = "auth_token";
export const FORCE_RESET_COOKIE = "force_reset";

const WEEK_SECONDS = 7 * 24 * 60 * 60;

/** Detect HTTPS when app runs behind ngrok/reverse proxy (Next sees http locally). */
export function isSecureRequest(req: NextRequest): boolean {
  return (
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https"
  );
}

export function authCookieOptions(req: NextRequest) {
  return {
    httpOnly: false,
    secure: isSecureRequest(req),
    sameSite: "lax" as const,
    path: "/",
    maxAge: WEEK_SECONDS,
  };
}
