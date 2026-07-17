import Cookies from "js-cookie";
import api from "./api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";
export const RESET_EMAIL_KEY = "reset_email";

function cookieOptions() {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  return {
    expires: 7,
    sameSite: "lax" as const,
    secure,
    path: "/",
  };
}

export type UserRole = "SUPER-ADMIN" | "ADMIN" | "HR" | "ACCOUNTING" | "EMPLOYEE";

export interface AuthUser {
  id: number;
  name: string;
  role: UserRole;
  employee_id?: number;
  force_reset_password?: boolean;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  user: AuthUser;
  force_reset_password?: boolean;
}

export async function loginUser(payload: LoginPayload) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.meta?.message ||
      data?.error?.message ||
      "Login failed";
    throw { status: response.status, message, data };
  }

  return data;
}

export async function forgetPassword(email: string) {
  const response = await api.post("/auth/forgetPassword", { email });
  return response.data;
}

export async function verifyResetCode(code: string) {
  const response = await api.post("/auth/verifyResetCode", { code });
  return response.data;
}

export async function resetPassword(email: string, newPassword: string) {
  const response = await api.patch("/auth/resetPassword", { email, newPassword });
  return response.data;
}

export async function changePassword(password: string, newPassword: string) {
  const response = await api.patch("/auth/changePassword", { password, newPassword });
  return response.data;
}

export async function logoutUser() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // ignore — local session will still be cleared
  }
  try {
    await api.post("/auth/logout");
  } catch {
    // ignore backend logout errors
  }
}

export const saveAuth = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const opts = cookieOptions();
  Cookies.set(TOKEN_KEY, token, opts);
  if (user.force_reset_password) {
    Cookies.set("force_reset", "1", opts);
  } else {
    Cookies.remove("force_reset", { path: "/" });
  }
};

export const updateUser = (user: AuthUser) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  Cookies.remove(TOKEN_KEY, { path: "/" });
  Cookies.remove("force_reset", { path: "/" });
};

// Backward-compatible alias used by legacy axios client.
export const removeToken = clearAuth;

export const isLoggedIn = () => !!getToken();
