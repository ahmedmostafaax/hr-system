"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorPage({
  title = "حدث خطأ",
  message = "تعذّر تحميل البيانات. يرجى المحاولة مرة أخرى.",
  onRetry,
  backHref,
  backLabel = "العودة",
}: ErrorPageProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const homeHref = backHref ?? `/${locale}`;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center" dir="rtl">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
      <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed">{message}</p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </button>
        )}

        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
