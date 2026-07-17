"use client";

import { notify } from "@/lib/toast";
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api"; // تأكد من مسار ملف الاكسيوس الخاص بك

interface SearchInputProps {
  endpoint: string; // الرابط المراد البحث فيه مثل "/department"
  onResultsFetched: (data: any[]) => void; // دالة لإرجاع النتائج للمكون الأب
  onLoading?: (isLoading: boolean) => void; // اختياري: لإظهار مؤشر تحميل في الأب
  placeholder?: string;
  className?: string;
  delay?: number;
}

export default function SearchInput({
  endpoint,
  onResultsFetched,
  onLoading,
  placeholder = "Search...",
  className = "",
  delay = 500,
}: SearchInputProps) {
  const params = useParams();
  const isRtl = params?.locale === "ar";
  
  const [localSearch, setLocalSearch] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  // استخدام useRef لتجنب تكرار طلبات الـ API غير الضرورية
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // التحقق من وجود نص للبحث أو العودة للبيانات الأصلية إذا كان الحقل فارغاً
    const fetchData = async () => {
      // إلغاء الطلب السابق إذا كان لا يزال جارياً
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      setIsFetching(true);
      onLoading?.(true);

      try {
        // بناء الرابط: إذا كان هناك كلمة بحث نستخدم keyword، وإلا نطلب البيانات كاملة
        const response = await api.get(localSearch 
          ? `${endpoint}?keyword=${encodeURIComponent(localSearch.trim())}`
          : endpoint, {
          signal: abortControllerRef.current.signal
        });

        // استخراج البيانات (تأكد من هيكلة الـ Response في الـ Backend الخاص بك)
        const results = Array.isArray(response.data) 
          ? response.data 
          : response.data.data || [];

        onResultsFetched(results);
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          notify.handleApiError(error as { message?: string });
        }
      } finally {
        setIsFetching(false);
        onLoading?.(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, delay);

    return () => {
      clearTimeout(delayDebounceFn);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [localSearch, endpoint, delay]);

  return (
    <div className={`relative group ${className}`}>
      <div className={`absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center pointer-events-none transition-colors group-focus-within:text-indigo-500 ${isRtl ? 'right-3.5' : 'left-3.5'}`}>
        {isFetching ? (
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        )}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className={`h-11 rounded-lg border border-slate-300 bg-white text-[14.5px] font-medium outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 w-full sm:w-80 md:w-96 transition-all shadow-sm placeholder:text-slate-400 ${isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
      />
    </div>
  );
}