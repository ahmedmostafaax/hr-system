const HIDDEN_KEYS = new Set([
  "password",
  "passwordResetToken",
  "passwordResetTokenExpire",
  "resetCode",
]);

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  id: { ar: "المعرف", en: "ID" },
  name: { ar: "الاسم", en: "Name" },
  full_name: { ar: "الاسم الكامل", en: "Full Name" },
  code: { ar: "الكود", en: "Code" },
  role: { ar: "الدور", en: "Role" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phone_number: { ar: "رقم الهاتف", en: "Phone" },
  status: { ar: "الحالة", en: "Status" },
  employee_id: { ar: "معرف الموظف", en: "Employee ID" },
  department_id: { ar: "معرف القسم", en: "Department ID" },
  leave_type_id: { ar: "نوع الإجازة", en: "Leave Type ID" },
  month: { ar: "الشهر", en: "Month" },
  year: { ar: "السنة", en: "Year" },
  start_date: { ar: "تاريخ البداية", en: "Start Date" },
  end_date: { ar: "تاريخ النهاية", en: "End Date" },
  days_count: { ar: "عدد الأيام", en: "Days Count" },
  base_salary: { ar: "المرتب الأساسي", en: "Base Salary" },
  net_salary: { ar: "صافي المرتب", en: "Net Salary" },
  amount: { ar: "المبلغ", en: "Amount" },
  reason: { ar: "السبب / الملاحظات", en: "Reason / Notes" },
  is_deleted: { ar: "محذوف", en: "Deleted" },
  is_active: { ar: "نشط", en: "Active" },
  type: { ar: "النوع", en: "Type" },
  job_title: { ar: "المسمى الوظيفي", en: "Job Title" },
  entity_type: { ar: "نوع الكيان", en: "Entity Type" },
  entity_id: { ar: "معرف الكيان", en: "Entity ID" },
  ip_address: { ar: "عنوان IP", en: "IP Address" },
  created_at: { ar: "تاريخ الإنشاء", en: "Created At" },
  updated_at: { ar: "تاريخ التحديث", en: "Updated At" },
  processed_at: { ar: "تاريخ المعالجة", en: "Processed At" },
  default_amount: { ar: "المبلغ الافتراضي", en: "Default Amount" },
  account_code: { ar: "كود الحساب", en: "Account Code" },
  is_salary: { ar: "ضمن الراتب", en: "In Salary" },
};

const ROLE_LABELS: Record<string, { ar: string; en: string }> = {
  "SUPER-ADMIN": { ar: "مدير النظام", en: "Super Admin" },
  ADMIN: { ar: "مدير", en: "Admin" },
  HR: { ar: "موارد بشرية", en: "HR" },
  ACCOUNTING: { ar: "محاسبة", en: "Accounting" },
  EMPLOYEE: { ar: "موظف", en: "Employee" },
};

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  approved: { ar: "معتمد", en: "Approved" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  active: { ar: "نشط", en: "Active" },
  suspended: { ar: "موقوف", en: "Suspended" },
  resigned: { ar: "مستقيل", en: "Resigned" },
  dismissed: { ar: "مفصول", en: "Dismissed" },
  draft: { ar: "مسودة", en: "Draft" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  paid: { ar: "مدفوع", en: "Paid" },
  open: { ar: "مفتوح", en: "Open" },
  closed: { ar: "مقفول", en: "Closed" },
};

export const ACTION_LABELS: Record<string, { ar: string; en: string }> = {
  CREATE: { ar: "إنشاء", en: "Create" },
  UPDATE: { ar: "تعديل", en: "Update" },
  DELETE: { ar: "حذف", en: "Delete" },
  LOGIN: { ar: "تسجيل دخول", en: "Login" },
  LOGOUT: { ar: "تسجيل خروج", en: "Logout" },
  APPROVE: { ar: "اعتماد", en: "Approve" },
  REJECT: { ar: "رفض", en: "Reject" },
};

export const ENTITY_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  Employee: { ar: "موظف", en: "Employee" },
  User: { ar: "مستخدم", en: "User" },
  Contract: { ar: "عقد", en: "Contract" },
  PayrollRun: { ar: "دورة رواتب", en: "Payroll Run" },
  JournalEntry: { ar: "قيد محاسبي", en: "Journal Entry" },
  AccountingPeriod: { ar: "فترة محاسبية", en: "Accounting Period" },
  LeaveRequest: { ar: "طلب إجازة", en: "Leave Request" },
  Attendance: { ar: "حضور", en: "Attendance" },
  Department: { ar: "قسم", en: "Department" },
};

function humanizeKey(key: string, isAr: boolean): string {
  const mapped = FIELD_LABELS[key];
  if (mapped) return isAr ? mapped.ar : mapped.en;
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isIsoDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

function formatScalar(value: unknown, key: string, isAr: boolean): string {
  if (value == null || value === "") return "—";

  if (typeof value === "boolean") {
    return value ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
  }

  if (typeof value === "number") {
    if (/(salary|amount|deduction|bonus|pay|total|net|base)/i.test(key)) {
      return `${value.toLocaleString(isAr ? "ar-EG" : "en-US")} ${isAr ? "ج.م" : "EGP"}`;
    }
    return value.toLocaleString(isAr ? "ar-EG" : "en-US");
  }

  if (typeof value === "string") {
    if (key === "role" && ROLE_LABELS[value]) {
      return isAr ? ROLE_LABELS[value].ar : ROLE_LABELS[value].en;
    }
    if (STATUS_LABELS[value]) {
      return isAr ? STATUS_LABELS[value].ar : STATUS_LABELS[value].en;
    }
    if (isIsoDateString(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(isAr ? "ar-EG" : "en-US");
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    return value.map((item) => formatScalar(item, key, isAr)).join(isAr ? "، " : ", ");
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v != null && v !== ""
    );
    if (entries.length === 0) return "—";
    return entries
      .map(([k, v]) => `${humanizeKey(k, isAr)}: ${formatScalar(v, k, isAr)}`)
      .join(isAr ? " · " : " · ");
  }

  return String(value);
}

export interface ReadableAuditEntry {
  key: string;
  label: string;
  value: string;
}

export function toReadableAuditEntries(
  record: Record<string, unknown> | null | undefined,
  isAr: boolean
): ReadableAuditEntry[] {
  if (!record || Object.keys(record).length === 0) return [];

  return Object.entries(record)
    .filter(([key, value]) => !HIDDEN_KEYS.has(key) && value != null && value !== "")
    .map(([key, value]) => ({
      key,
      label: humanizeKey(key, isAr),
      value: formatScalar(value, key, isAr),
    }));
}

export function labelAction(action: string, isAr: boolean): string {
  const mapped = ACTION_LABELS[action];
  return mapped ? (isAr ? mapped.ar : mapped.en) : action;
}

export function labelEntityType(entityType: string, isAr: boolean): string {
  const mapped = ENTITY_TYPE_LABELS[entityType];
  return mapped ? (isAr ? mapped.ar : mapped.en) : entityType;
}
