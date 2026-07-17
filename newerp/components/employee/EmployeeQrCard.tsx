"use client";

import QRCode from "react-qr-code";

export interface EmployeeQrPayload {
  type: "erb_employee";
  employee_id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

interface EmployeeQrCardProps {
  payload: EmployeeQrPayload;
  isAr?: boolean;
}

export function EmployeeQrCard({ payload, isAr = true }: EmployeeQrCardProps) {
  const value = JSON.stringify(payload);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="rounded-xl bg-white p-4 shadow-inner ring-1 ring-slate-100">
        <QRCode value={value} size={200} level="M" />
      </div>
      <div className="mt-5 w-full space-y-2 text-center">
        <p className="text-lg font-bold text-slate-800">{payload.name}</p>
        <p className="font-mono text-sm text-indigo-600">{payload.code}</p>
        {payload.email && <p className="text-sm text-slate-500">{payload.email}</p>}
        {payload.phone && <p className="text-sm text-slate-500">{payload.phone}</p>}
      </div>
      <p className="mt-4 text-xs text-slate-400">
        {isAr
          ? "اعرض هذا الرمز عند تسجيل الحضور"
          : "Show this code when checking in"}
      </p>
    </div>
  );
}

export function buildEmployeeQrPayload(employee: {
  id: number;
  code: string;
  full_name: string;
  email?: string | null;
  phone_number?: string | null;
}): EmployeeQrPayload {
  return {
    type: "erb_employee",
    employee_id: employee.id,
    code: employee.code,
    name: employee.full_name,
    email: employee.email ?? undefined,
    phone: employee.phone_number ?? undefined,
  };
}
