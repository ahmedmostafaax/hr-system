import axios from "axios";
import { getToken, removeToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor — إضافة token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — معالجة الأخطاء
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ فعّل هذا الكود بدل ما كان commented
    if (error.response?.status === 401) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/ar/login";
      }
    }

    // ✅ معالجة 403 Period Locked
    if (error.response?.status === 403) {
      const message = error.response?.data?.message;
      if (message?.includes("period") || message?.includes("الفترة")) {
        // أطلق toast إن أمكن
        console.error("🔒 الفترة المحاسبية مقفولة:", message);
        // يمكن استدعاء toast هنا إن كانت متاحة
      }
    }

    return Promise.reject(error);
  }
);

export default api;
