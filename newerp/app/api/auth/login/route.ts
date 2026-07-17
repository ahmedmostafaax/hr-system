import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  FORCE_RESET_COOKIE,
  authCookieOptions,
} from "@/lib/authCookies";

const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL || "http://localhost:5000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    const token = data?.data?.token as string | undefined;
    if (!token) {
      return NextResponse.json(
        { meta: { message: "Invalid login response — missing token" } },
        { status: 500 }
      );
    }

    const forceReset = !!(
      data?.data?.force_reset_password ?? data?.data?.user?.force_reset_password
    );

    const response = NextResponse.json(data);
    const opts = authCookieOptions(req);

    response.cookies.set(AUTH_TOKEN_COOKIE, token, opts);

    if (forceReset) {
      response.cookies.set(FORCE_RESET_COOKIE, "1", opts);
    } else {
      response.cookies.set(FORCE_RESET_COOKIE, "", { ...opts, maxAge: 0 });
    }

    return response;
  } catch {
    return NextResponse.json(
      { meta: { message: "Login request failed" } },
      { status: 500 }
    );
  }
}
