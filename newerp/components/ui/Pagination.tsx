"use client";

import { notify } from "@/lib/toast";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

interface PaginationProps {
  endpoint: string; // مثال: "/department"
  keyword?: string; // لربط الترقيم بالبحث الحالي
  onDataFetched: (data: any[]) => void; // لتحديث الجدول بالبيانات الجديدة
  onLoading?: (isLoading: boolean) => void;
  pageSize?: number; // افتراضي 20 كما في الـ API الخاص بك
  refreshTrigger?: number; // تحديث البيانات بدون عمل reload
}

export default function Pagination({
  endpoint,
  keyword = "",
  onDataFetched,
  onLoading,
  refreshTrigger = 0,
}: PaginationProps) {
  const params = useParams();
  const isRtl = params?.locale === "ar";
  const t = useTranslations("common.pagination");

  // حالة الترقيم بناءً على هيكلة الـ API الخاص بك
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const fetchPage = async (pageNumber: number) => {
    onLoading?.(true);
    try {
      // إرسال رقم الصفحة والكلمة المفتاحية (keyword) في الرابط
      const response = await api.get(endpoint, {
        params: {
          page: pageNumber,
          keyword: keyword || undefined,
        },
      });

      const { data, meta: responseMeta } = response.data;

      // تحديث البيانات في الصفحة الأساسية
      onDataFetched(data || []);

      // تحديث حالة الأزرار بناءً على الـ pagination القادم من الـ API
      if (responseMeta?.pagination) {
        setMeta({
          page: responseMeta.pagination.page,
          totalPages: responseMeta.pagination.totalPages,
          totalItems: responseMeta.pagination.totalItems,
        });
      }
    } catch (error) {
      notify.handleApiError(error as { message?: string });
    } finally {
      onLoading?.(false);
    }
  };

  // إعادة طلب البيانات عند تغيير البحث أو الـ endpoint
  useEffect(() => {
    fetchPage(1);
  }, [keyword, endpoint]);

  // إعادة طلب نفس الصفحة عند استلام أمر تحديث (refreshTrigger)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchPage(meta.page);
    }
  }, [refreshTrigger]);

  // إذا كانت الصفحات أقل من أو تساوي 1 لا تظهر شيئاً
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white" dir={isRtl ? "rtl" : "ltr"}>
      {/* عرض تفاصيل العدد */}
      <div className="hidden md:block">
        <p className="text-[13px] text-slate-500">
          {t('showing')}{" "}
          <span className="font-bold text-slate-900">{meta.page}</span>{" "}
          {t('of')}{" "}
          <span className="font-bold text-slate-900">{meta.totalPages}</span>
          <span className="mx-2 text-slate-300">|</span>
          {t('totalItems')} <span className="font-medium text-slate-600">{meta.totalItems}</span>
        </p>
      </div>

      {/* أزرار الصفحات */}
      <div className="flex items-center gap-1.5">
        {/* زر السابق */}
        <button
          onClick={() => fetchPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {t('previous')}
        </button>

      
        <div className="flex items-center gap-1">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => fetchPage(pageNum)}
              className={`w-9 h-9 rounded-lg text-[13px] font-bold transition-all ${
                meta.page === pageNum
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>

        {/* زر التالي */}
        <button
          onClick={() => fetchPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {t('next')}
        </button>
      </div>
    </div>
  );
}