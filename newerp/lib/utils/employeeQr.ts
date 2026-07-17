import type { EmployeeQrPayload } from "@/components/employee/EmployeeQrCard";

export function parseEmployeeQrPayload(text: string): EmployeeQrPayload | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    if (data.type === "erb_employee" && data.employee_id != null) {
      return {
        type: "erb_employee",
        employee_id: Number(data.employee_id),
        code: String(data.code ?? data.employee_id),
        name: String(data.name ?? ""),
        email: data.email ? String(data.email) : undefined,
        phone: data.phone ? String(data.phone) : undefined,
      };
    }
  } catch {
    // not JSON — try numeric employee id
  }

  const asNum = Number(trimmed);
  if (Number.isFinite(asNum) && asNum > 0) {
    return {
      type: "erb_employee",
      employee_id: asNum,
      code: trimmed,
      name: "",
    };
  }

  return null;
}

export function todayWorkDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function scanActionFromMode(
  mode: "auto" | "check_in" | "check_out"
): "auto" | "check_in" | "check_out" {
  return mode;
}
