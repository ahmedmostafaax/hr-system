"use client";

import { useTranslations } from "next-intl";

interface LoadingProps {
  className?: string;
  message?: string;
}

export default function Loading({ className = "", message }: LoadingProps) {
  const t = useTranslations("departments.messages");

  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
      <div className="relative flex items-center justify-center w-10 h-10">
        <div className="absolute w-full h-full border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute w-full h-full border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-500 font-medium animate-pulse">
        {message || t("loading")}
      </p>
    </div>
  );
}
