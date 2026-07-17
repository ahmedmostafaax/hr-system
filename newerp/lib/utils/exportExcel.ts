import type { DataTableColumn } from "@/components/shared";

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function formatScalar(value: unknown, isAr: boolean): string | number {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "boolean") return value ? (isAr ? "نعم" : "Yes") : (isAr ? "لا" : "No");
  if (value instanceof Date) {
    return value.toLocaleDateString(isAr ? "ar-EG" : "en-US");
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString(isAr ? "ar-EG" : "en-US");
      }
    }
    return value;
  }
  if (typeof value === "object") return "";
  return String(value);
}

export function getExportCellValue<T>(
  row: T,
  col: DataTableColumn<T>,
  isAr: boolean
): string | number {
  if (col.exportValue) {
    const value = col.exportValue(row);
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    return String(value);
  }

  if (col.exportKey) {
    return formatScalar(getNestedValue(row, col.exportKey), isAr);
  }

  const record = row as Record<string, unknown>;
  const key = col.key;

  if (key === "employee" || key === "Employee") {
    const emp = (record.Employee ?? record.employee) as
      | { full_name?: string; code?: string }
      | undefined;
    if (emp?.full_name) {
      return emp.code ? `${emp.full_name} (${emp.code})` : emp.full_name;
    }
  }

  if (key.includes(".")) {
    return formatScalar(getNestedValue(row, key), isAr);
  }

  return formatScalar(record[key], isAr);
}

export interface ExportTableOptions<T> {
  rows: T[];
  columns: DataTableColumn<T>[];
  filename: string;
  sheetName?: string;
  isAr?: boolean;
}

export async function exportTableToExcel<T>({
  rows,
  columns,
  filename,
  sheetName = "Data",
  isAr = true,
}: ExportTableOptions<T>) {
  const XLSX = await import("xlsx");

  const headers = columns.map((col) => col.label);
  const body = rows.map((row) =>
    columns.map((col) => getExportCellValue(row, col, isAr))
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...body]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const safeName = filename.replace(/[^\w\u0600-\u06FF-]+/g, "_").replace(/_+/g, "_");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${safeName}_${date}.xlsx`);
}
