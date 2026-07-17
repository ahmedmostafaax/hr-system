import axios, { AxiosInstance, AxiosError } from "axios";
import { getToken, clearAuth } from "./auth";

function getCurrentLocale(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "ar";
  }
  const seg = window.location.pathname.split("/")[1];
  return seg === "en" || seg === "ar"
    ? seg
    : process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "ar";
}

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // ngrok free tier: skip interstitial on API requests
  config.headers["ngrok-skip-browser-warning"] = "true";
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (
    error: AxiosError<{
      error?: { message?: string };
      meta?: { message?: string };
    }>
  ) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.meta?.message ||
      error.message ||
      "حدث خطأ غير متوقع";

    if (status === 401) {
      const requestUrl = error.config?.url ?? "";
      const isPasswordChange = requestUrl.includes("/auth/changePassword");
      if (!isPasswordChange) {
        clearAuth();
        if (typeof window !== "undefined") {
          window.location.href = `/${getCurrentLocale()}/login`;
        }
      }
    }

    return Promise.reject({ status, message, data: error.response?.data });
  }
);

export default api;
