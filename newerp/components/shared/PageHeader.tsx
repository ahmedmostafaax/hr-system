"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { getUser } from "@/lib/auth";
import { can, Permission } from "@/lib/permissions";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  permission?: Permission;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: PageHeaderAction;
}

export function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const isRtl = locale === "ar";
  const user = getUser();

  const showAction =
    action && (!action.permission || (user && can(user.role, action.permission)));

  return (
    <div className="mb-6 space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className={`flex items-center gap-1.5 text-sm text-slate-500 ${isRtl ? "flex-row-reverse" : ""}`}
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((item, i) => {
            const isLast = i === breadcrumbs.length - 1;
            const Sep = isRtl ? ChevronLeft : ChevronRight;

            return (
              <span
                key={`${item.label}-${i}`}
                className={`flex items-center gap-1.5 ${isRtl ? "flex-row-reverse" : ""}`}
              >
                {i > 0 && <Sep className="w-3.5 h-3.5 shrink-0 text-slate-300" />}
                {item.href && !isLast ? (
                  <Link
                    href={item.href}
                    className="hover:text-indigo-600 transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? "text-slate-800 font-semibold" : "font-medium"}
                  >
                    {item.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isRtl ? "sm:flex-row-reverse" : ""}`}
      >
        <div className={`flex items-center gap-3 ${isRtl ? "flex-row-reverse" : ""}`}>
          <div className="h-8 w-1 rounded-full bg-indigo-600 shrink-0" />
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
        </div>

        {showAction && (
          <button
            type="button"
            onClick={action.onClick}
            className={`inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-95 ${isRtl ? "flex-row-reverse" : ""}`}
          >
            <Plus className="w-4 h-4" />
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
