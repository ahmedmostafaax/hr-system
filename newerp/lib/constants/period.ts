export const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

export const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function monthLabel(month: number, isAr: boolean) {
  const names = isAr ? MONTHS_AR : MONTHS_EN;
  return names[month - 1] ?? String(month);
}

export function yearOptions(count = 6) {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current - i);
}
