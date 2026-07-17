/** Normalize TIME / Date / string to HH:mm:ss */
export function normalizeTimeValue(time: string | Date | null | undefined): string {
  if (!time) return "00:00:00";
  if (time instanceof Date) {
    return time.toTimeString().slice(0, 8);
  }
  const s = String(time).trim();
  if (s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toTimeString().slice(0, 8);
    }
  }
  const parts = s.split(":");
  if (parts.length >= 2) {
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    const sec = (parts[2] ?? "00").slice(0, 2).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }
  return "00:00:00";
}

export function timeToMinutes(time: string | Date | null | undefined): number {
  const normalized = normalizeTimeValue(time);
  const [h, m, s] = normalized.split(":").map(Number);
  return h * 60 + m + (s || 0) / 60;
}

export function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateLateHours(
  checkInMinutes: number,
  shiftStartMinutes: number,
  graceMinutes: number
): number {
  let lateMinutes =
    checkInMinutes > shiftStartMinutes ? checkInMinutes - shiftStartMinutes : 0;
  if (lateMinutes <= graceMinutes) {
    lateMinutes = 0;
  }
  return roundHours(lateMinutes / 60);
}

export function localWorkDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentTimeString(d = new Date()): string {
  return d.toTimeString().slice(0, 8);
}
