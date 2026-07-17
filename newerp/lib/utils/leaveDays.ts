export function parseDateOnly(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const raw = String(value).split("T")[0];
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Inclusive day count: 1 Oct → 5 Oct = 5 days */
export function calcInclusiveLeaveDays(start: unknown, end: unknown): number | null {
  const s = parseDateOnly(start);
  const e = parseDateOnly(end);
  if (!s || !e) return null;
  if (e < s) return null;
  const diffMs = e.getTime() - s.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}
