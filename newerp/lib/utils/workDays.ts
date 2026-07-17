import type { WorkDay } from "@/lib/services/entities";

const DAY_ORDER: WorkDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Accepts array, `{ sun: true, ... }`, or comma-separated string from API/seed. */
export function normalizeWorkDays(value: unknown): WorkDay[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    return value.map((d) => String(d).trim().toLowerCase()).filter(Boolean) as WorkDay[];
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v === true || v === "true" || v === 1)
      .map(([day]) => day.trim().toLowerCase() as WorkDay)
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean) as WorkDay[];
  }

  return [];
}
