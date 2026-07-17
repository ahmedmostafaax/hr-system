export function currencySymbol(isAr: boolean): string {
  return isAr ? "ج.م" : "EGP";
}

export function formatCurrency(
  value: unknown,
  isAr = true,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const n = parseFloat(String(value ?? 0));
  if (!Number.isFinite(n)) return "—";
  const formatted = n.toLocaleString(isAr ? "ar-EG" : "en-US", {
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  });
  return `${formatted} ${currencySymbol(isAr)}`;
}
