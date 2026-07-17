export type StatusValue =
  | "active"
  | "inactive"
  | "suspended"
  | "draft"
  | "confirmed"
  | "paid"
  | "open"
  | "closed"
  | "advance"
  | "loan";

const config: Record<
  StatusValue,
  { label: string; className: string }
> = {
  active: { label: "نشط", className: "bg-green-100 text-green-800 border-green-200" },
  inactive: { label: "غير نشط", className: "bg-slate-100 text-slate-600 border-slate-200" },
  suspended: { label: "موقوف", className: "bg-orange-100 text-orange-800 border-orange-200" },
  draft: { label: "مسودة", className: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "مؤكد", className: "bg-blue-100 text-blue-800 border-blue-200" },
  paid: { label: "مدفوع", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  open: { label: "مفتوحة", className: "bg-sky-100 text-sky-800 border-sky-200" },
  closed: { label: "مقفولة", className: "bg-amber-100 text-amber-800 border-amber-200" },
  advance: { label: "سلفة", className: "bg-violet-100 text-violet-800 border-violet-200" },
  loan: { label: "قرض", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

interface StatusBadgeProps {
  status: StatusValue | string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = "" }: StatusBadgeProps) {
  const key = (status?.toLowerCase?.() || "inactive") as StatusValue;
  const item = config[key] ?? {
    label: label || String(status),
    className: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.className} ${className}`}
    >
      {label ?? item.label}
    </span>
  );
}
