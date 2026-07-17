"use client";

import { useMemo } from "react";
import { LayoutGrid, Shield, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRole } from "@/lib/auth";
import { getAccessibleNavForRole, countAccessiblePages } from "@/lib/rolePortfolio";
import { USER_ROLE_LABELS } from "@/lib/userRoles";

interface UserPortfolioModalProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  role: UserRole;
  isAr?: boolean;
}

export function UserPortfolioModal({
  open,
  onClose,
  userName,
  role,
  isAr = true,
}: UserPortfolioModalProps) {
  const t = useTranslations("sidebar");

  const portfolio = useMemo(() => getAccessibleNavForRole(role), [role]);
  const pageCount = useMemo(() => countAccessiblePages(role), [role]);
  const roleLabel = isAr ? USER_ROLE_LABELS[role].ar : USER_ROLE_LABELS[role].en;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-800">
              {isAr ? "صلاحيات المستخدم" : "User Access Portfolio"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
            <p className="font-semibold text-slate-800">{userName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 font-medium text-indigo-700 ring-1 ring-indigo-200">
                <Shield className="h-3.5 w-3.5" />
                {roleLabel}
              </span>
              <span className="text-slate-500">
                {isAr
                  ? `${pageCount} صفحة/مكوّن متاح`
                  : `${pageCount} accessible page(s)`}
              </span>
            </div>
          </div>

          {role === "SUPER-ADMIN" && (
            <p className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-800">
              {isAr
                ? "مدير النظام لديه صلاحية الوصول لجميع أقسام النظام."
                : "Super Admin has access to all system sections."}
            </p>
          )}

          <div className="space-y-4">
            {portfolio.map((group) => (
              <div key={group.groupKey}>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t(group.groupLabelKey)}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item.key}
                      className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700"
                      title={item.path || "/"}
                    >
                      {t(item.labelKey)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {portfolio.length === 0 && (
            <p className="text-center text-sm text-slate-500">
              {isAr ? "لا توجد صفحات متاحة لهذا الدور." : "No pages available for this role."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
