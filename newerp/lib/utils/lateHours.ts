/** Format late delay stored as decimal hours */
export function formatLateHours(
  value: unknown,
  isAr = true,
  decimals = 2
): string {
  const n = parseFloat(String(value ?? 0));
  if (!Number.isFinite(n) || n <= 0) return "0";
  const unit = isAr ? "س" : "h";
  return `${n.toFixed(decimals)} ${unit}`;
}

/** Legacy rows may still expose late_minutes — convert to hours for display */
export function lateHoursFromRow(row: {
  late_hours?: unknown;
  late_minutes?: unknown;
}): number {
  if (row.late_hours != null && row.late_hours !== "") {
    return parseFloat(String(row.late_hours)) || 0;
  }
  const mins = parseFloat(String(row.late_minutes ?? 0)) || 0;
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0;
}
