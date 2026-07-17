"use client";

import { useState } from "react";
import { Download, ImageDown, KeyRound, Loader2, Printer, X } from "lucide-react";
import { USER_ROLE_LABELS } from "@/lib/userRoles";
import type { UserRole } from "@/lib/auth";
import {
  downloadCredentialsImage,
  downloadCredentialsPdf,
  printCredentials,
} from "@/lib/credentialsExport";
import { notify } from "@/lib/toast";

export interface CredentialsData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface CredentialsModalProps {
  open: boolean;
  onClose: () => void;
  data: CredentialsData;
  isAr?: boolean;
  title?: string;
  subtitle?: string;
}

function roleLabel(role: string | undefined, isAr: boolean) {
  if (!role) return null;
  const labels = USER_ROLE_LABELS[role as UserRole];
  if (labels) return isAr ? labels.ar : labels.en;
  return role;
}

export function CredentialsModal({
  open,
  onClose,
  data,
  isAr = true,
  title,
  subtitle,
}: CredentialsModalProps) {
  const [exporting, setExporting] = useState<"print" | "pdf" | "image" | null>(null);

  if (!open) return null;

  const resolvedTitle = title ?? (isAr ? "بيانات حساب الموظف" : "Employee Login Credentials");
  const resolvedSubtitle =
    subtitle ??
    (isAr ? "احفظ كلمة المرور — لن تظهر مرة أخرى" : "Save this password — it won't be shown again");
  const roleText = roleLabel(data.role, isAr);
  const safeFilename = `credentials-${data.email.split("@")[0] || "employee"}`;

  const exportLabels = {
    title: resolvedTitle,
    subtitle: resolvedSubtitle,
    name: data.name,
    email: data.email,
    role: roleText ?? undefined,
    password: data.password,
  };

  const runExport = async (action: "print" | "pdf" | "image") => {
    setExporting(action);
    try {
      if (action === "print") {
        printCredentials(exportLabels, isAr);
      } else if (action === "pdf") {
        await downloadCredentialsPdf(exportLabels, isAr, safeFilename);
      } else {
        await downloadCredentialsImage(exportLabels, isAr, safeFilename);
      }
    } catch (err) {
      const message = (err as Error)?.message;
      if (message === "POPUP_BLOCKED") {
        notify.error(
          isAr
            ? "المتصفّح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم حاول مرة أخرى."
            : "Popup blocked. Allow popups and try again."
        );
      } else {
        notify.error(
          isAr ? "تعذّر التصدير. حاول مرة أخرى." : "Export failed. Please try again."
        );
      }
    } finally {
      setExporting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">{resolvedTitle}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {resolvedSubtitle}
          </p>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <p className="border-b border-slate-100 pb-3 text-center text-base font-bold text-slate-800">
              {resolvedTitle}
            </p>
            <p>
              <span className="text-slate-500">{isAr ? "الاسم:" : "Name:"}</span>{" "}
              <strong className="text-slate-800">{data.name}</strong>
            </p>
            <p>
              <span className="text-slate-500">{isAr ? "البريد:" : "Email:"}</span>{" "}
              <strong className="text-slate-800">{data.email}</strong>
            </p>
            {roleText && (
              <p>
                <span className="text-slate-500">{isAr ? "الدور:" : "Role:"}</span>{" "}
                <strong className="text-slate-800">{roleText}</strong>
              </p>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-3">
              <KeyRound className="h-4 w-4 shrink-0 text-indigo-500" />
              <span className="font-mono text-base font-bold tracking-wide text-indigo-700">
                {data.password}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={!!exporting}
              onClick={() => runExport("print")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting === "print" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              {isAr ? "طباعة" : "Print"}
            </button>
            <button
              type="button"
              disabled={!!exporting}
              onClick={() => runExport("pdf")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </button>
            <button
              type="button"
              disabled={!!exporting}
              onClick={() => runExport("image")}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {exporting === "image" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageDown className="h-4 w-4" />
              )}
              {isAr ? "صورة" : "Image"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
