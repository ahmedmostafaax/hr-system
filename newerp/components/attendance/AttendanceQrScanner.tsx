"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ChevronDown, Loader2, LogIn, LogOut, RefreshCw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import type { EmployeeQrPayload } from "@/components/employee/EmployeeQrCard";
import { attendanceService, type Attendance } from "@/lib/services";
import { notify } from "@/lib/toast";
import { formatLateHours, lateHoursFromRow } from "@/lib/utils/lateHours";
import { parseEmployeeQrPayload, scanActionFromMode, todayWorkDate } from "@/lib/utils/employeeQr";
import { useCamera } from "@/lib/hooks/useCamera";
import { notifyAttendanceRecorded } from "@/lib/attendance/attendanceLive";

type ScanMode = "auto" | "check_in" | "check_out";

interface ScanResult {
  employee: EmployeeQrPayload;
  action: "check_in" | "check_out";
  time?: string | null;
  late_hours?: number;
  working_hours?: number;
  overtime_hours?: number;
}

interface AttendanceQrScannerProps {
  isAr?: boolean;
  className?: string;
  /** Called after a successful check-in / check-out (same tab refresh). */
  onAttendanceRecorded?: () => void;
}

const SCANNER_ID = "erb-attendance-qr-scanner";

export function AttendanceQrScannerButton({
  isAr = true,
  className = "",
  onAttendanceRecorded,
}: AttendanceQrScannerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ScanMode>("auto");
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ key: string; at: number } | null>(null);
  const processingRef = useRef(false);
  const startAttemptRef = useRef(0);

  const {
    cameras,
    selectedDeviceId,
    hasMobileCamera,
    permissionDenied,
    enumerating,
    enumerate,
    selectCamera,
  } = useCamera();

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === 2) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }
  }, []);

  const recordAttendance = useCallback(
    async (payload: EmployeeQrPayload) => {
      const workDate = todayWorkDate();
      const apiAction = scanActionFromMode(mode);

      const record = (await attendanceService.create({
        employee_id: payload.employee_id,
        work_date: workDate,
        action: apiAction,
      } as Partial<Attendance> & { action?: string })) as Attendance & {
        scan_action?: "check_in" | "check_out";
      };

      const action: "check_in" | "check_out" =
        record.scan_action ??
        (record.check_out ? "check_out" : "check_in");

      return {
        employee: payload,
        action,
        time: action === "check_in" ? record.check_in : record.check_out,
        late_hours: lateHoursFromRow(record),
        working_hours: parseFloat(String(record.working_hours ?? 0)) || 0,
        overtime_hours: parseFloat(String(record.overtime_hours ?? 0)) || 0,
      } satisfies ScanResult;
    },
    [mode]
  );

  const handleScan = useCallback(
    async (raw: string) => {
      if (processingRef.current) return;

      const payload = parseEmployeeQrPayload(raw);
      if (!payload) {
        notify.error(isAr ? "رمز QR غير صالح" : "Invalid QR code");
        return;
      }

      const dedupeKey = `${payload.employee_id}:${mode}`;
      const now = Date.now();
      if (
        lastScanRef.current?.key === dedupeKey &&
        now - lastScanRef.current.at < 2500
      ) {
        return;
      }
      lastScanRef.current = { key: dedupeKey, at: now };

      processingRef.current = true;
      setProcessing(true);
      try {
        const result = await recordAttendance(payload);
        setLastResult(result);
        notifyAttendanceRecorded();
        onAttendanceRecorded?.();
        const label = payload.name || payload.code;
        if (result.action === "check_in") {
          const late =
            (result.late_hours ?? 0) > 0
              ? isAr
                ? ` — تأخير: ${formatLateHours(result.late_hours, true)}`
                : ` — late: ${formatLateHours(result.late_hours, false)}`
              : "";
          notify.success(
            isAr
              ? `تم تسجيل حضور ${label}${late}`
              : `Check-in recorded for ${label}${late}`
          );
        } else {
          const extra = [
            (result.late_hours ?? 0) > 0
              ? isAr
                ? `تأخير: ${formatLateHours(result.late_hours, true)}`
                : `late: ${formatLateHours(result.late_hours, false)}`
              : null,
            (result.working_hours ?? 0) > 0
              ? isAr
                ? `عمل: ${result.working_hours?.toFixed(2)} س`
                : `work: ${result.working_hours?.toFixed(2)} h`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");
          notify.success(
            isAr
              ? `تم تسجيل انصراف ${label}${extra ? ` — ${extra}` : ""}`
              : `Check-out recorded for ${label}${extra ? ` — ${extra}` : ""}`
          );
        }
      } catch (err) {
        notify.handleApiError(err as { message?: string });
      } finally {
        processingRef.current = false;
        setProcessing(false);
      }
    },
    [isAr, mode, onAttendanceRecorded, recordAttendance]
  );

  useEffect(() => {
    if (open) {
      void enumerate();
    }
  }, [open, enumerate]);

  useEffect(() => {
    if (!open) {
      void stopScanner();
      return;
    }

    if (permissionDenied || enumerating || !selectedDeviceId) return;

    const attemptId = ++startAttemptRef.current;
    let cancelled = false;

    const start = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled || attemptId !== startAttemptRef.current) return;

      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ID);
      if (cancelled || attemptId !== startAttemptRef.current) return;
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { deviceId: { exact: selectedDeviceId } },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            void handleScan(decoded);
          },
          () => {
            // ignore scan failures while searching
          }
        );
      } catch {
        notify.error(
          isAr
            ? "تعذر فتح الكاميرا — تأكد من السماح بالوصول"
            : "Could not open camera — please allow access"
        );
      }
    };

    void start();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, selectedDeviceId, enumerating, permissionDenied, handleScan, isAr, stopScanner]);

  const modeButtons: { id: ScanMode; label: string; icon: typeof LogIn }[] = [
    { id: "auto", label: isAr ? "تلقائي" : "Auto", icon: RefreshCw },
    { id: "check_in", label: isAr ? "حضور" : "Check In", icon: LogIn },
    { id: "check_out", label: isAr ? "انصراف" : "Check Out", icon: LogOut },
  ];

  const showCameraSelector = !hasMobileCamera && cameras.length > 1;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setLastResult(null);
          setOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-100 ${className}`}
        title={isAr ? "مسح QR للحضور" : "Scan QR for attendance"}
        aria-label={isAr ? "مسح QR للحضور" : "Scan QR for attendance"}
      >
        <Camera className="h-5 w-5" />
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={isAr ? "مسح QR — تسجيل الحضور" : "QR Scan — Attendance"}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {modeButtons.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setMode(id);
                  setLastResult(null);
                  lastScanRef.current = null;
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  mode === id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500">
            {mode === "auto"
              ? isAr
                ? "امسح رمز الموظف — أول مسح = حضور، ثاني مسح = انصراف"
                : "Scan employee QR — first scan = check-in, second = check-out"
              : mode === "check_in"
                ? isAr
                  ? "امسح رمز الموظف لتسجيل الحضور فقط"
                  : "Scan to record check-in only"
                : isAr
                  ? "امسح رمز الموظف لتسجيل الانصراف فقط"
                  : "Scan to record check-out only"}
          </p>

          {permissionDenied && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {isAr
                ? "تعذر الوصول إلى الكاميرا — يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح ثم إعادة المحاولة"
                : "Camera access denied — please allow camera access in your browser settings and try again"}
            </div>
          )}

          {showCameraSelector && (
            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm font-semibold text-slate-600">
                {isAr ? "الكاميرا" : "Camera"}
              </label>
              <div className="relative flex-1">
                <select
                  value={selectedDeviceId ?? ""}
                  onChange={(e) => selectCamera(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-700 transition hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  {cameras.map((cam) => (
                    <option key={cam.deviceId} value={cam.deviceId}>
                      {cam.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute inset-y-0 end-0 my-auto me-2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          )}

          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
            {enumerating && (
              <div className="flex min-h-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <div
              id={SCANNER_ID}
              className={`w-full [&>video]:!rounded-xl ${enumerating ? "hidden" : ""}`}
            />
            {processing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
          </div>

          {lastResult && (
            <div
              className={`rounded-xl border p-4 ${
                lastResult.action === "check_in"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-sky-200 bg-sky-50"
              }`}
            >
              <p className="font-bold text-slate-800">
                {lastResult.employee.name || lastResult.employee.code}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {lastResult.action === "check_in"
                  ? isAr
                    ? "✓ تم تسجيل الحضور"
                    : "✓ Check-in recorded"
                  : isAr
                    ? "✓ تم تسجيل الانصراف"
                    : "✓ Check-out recorded"}
                {lastResult.time ? ` — ${String(lastResult.time).slice(0, 8)}` : ""}
              </p>
              {(lastResult.late_hours ?? 0) > 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  {isAr ? "التأخير: " : "Late: "}
                  {formatLateHours(lastResult.late_hours, isAr)}
                </p>
              )}
              {lastResult.action === "check_out" &&
                (lastResult.working_hours ?? 0) > 0 && (
                  <p className="mt-0.5 text-xs text-slate-600">
                    {isAr ? "ساعات العمل: " : "Working: "}
                    {lastResult.working_hours?.toFixed(2)} {isAr ? "س" : "h"}
                  </p>
                )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
