"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { RoleGuard } from "@/components/shared";
import { EmployeeQrCard, buildEmployeeQrPayload } from "@/components/employee/EmployeeQrCard";
import { employeeService } from "@/lib/services";
import { notify, type ApiErrorLike } from "@/lib/toast";

export default function MyAttendancePage() {
  const params = useParams();
  const locale = params?.locale as string;
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ReturnType<typeof buildEmployeeQrPayload> | null>(null);

  useEffect(() => {
    employeeService
      .getMe()
      .then((emp) => emp && setPayload(buildEmployeeQrPayload(emp)))
      .catch((err) => notify.handleApiError(err as ApiErrorLike))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard permission="read:ownAttendance">
      <div className="p-6">
        <h1 className="mb-2 text-2xl font-bold text-slate-800">
          {isAr ? "الحضور" : "Attendance"}
        </h1>
        <p className="mb-8 text-sm text-slate-500">
          {isAr
            ? "رمز QR يحتوي بياناتك للتحقق عند تسجيل الحضور"
            : "Your QR code for attendance check-in"}
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : payload ? (
          <EmployeeQrCard payload={payload} isAr={isAr} />
        ) : (
          <p className="text-center text-slate-500">
            {isAr ? "تعذر تحميل بيانات الموظف" : "Could not load employee data"}
          </p>
        )}
      </div>
    </RoleGuard>
  );
}
