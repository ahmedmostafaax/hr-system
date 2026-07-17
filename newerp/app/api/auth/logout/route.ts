import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  FORCE_RESET_COOKIE,
  authCookieOptions,
} from "@/lib/authCookies";

export async function POST(req: NextRequest) {
  const opts = authCookieOptions(req);
  const response = NextResponse.json({ meta: { success: true } });
  response.cookies.set(AUTH_TOKEN_COOKIE, "", { ...opts, maxAge: 0 });
  response.cookies.set(FORCE_RESET_COOKIE, "", { ...opts, maxAge: 0 });
  return response;
}
