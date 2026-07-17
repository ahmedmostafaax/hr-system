const MONTHS_AR = [
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
];

const MONTHS_EN = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const STATUS_ALIASES: Record<string, "draft" | "confirmed" | "paid"> = {
  draft: "draft",
  مسودة: "draft",
  confirmed: "confirmed",
  confirm: "confirmed",
  مؤكد: "confirmed",
  معتمد: "confirmed",
  paid: "paid",
  مدفوع: "paid",
  دفع: "paid",
};

export interface ParsedPayrollKeyword {
  month?: number;
  year?: number;
  status?: "draft" | "confirmed" | "paid";
  /** True when keyword was consumed by structured filters (drop free-text search). */
  consumed: boolean;
}

export function parsePayrollKeyword(keyword: string): ParsedPayrollKeyword {
  const raw = keyword.trim();
  const q = raw.toLowerCase();
  const result: ParsedPayrollKeyword = { consumed: false };

  if (!raw) return result;

  for (let i = 0; i < 12; i++) {
    if (q.includes(MONTHS_AR[i]!) || q.includes(MONTHS_EN[i]!)) {
      result.month = i + 1;
      break;
    }
  }

  const yearMatch = raw.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    result.year = Number(yearMatch[1]);
  }

  if (result.month === undefined) {
    const monthNum = raw.match(/^\s*(\d{1,2})\s*$/);
    if (monthNum) {
      const m = Number(monthNum[1]);
      if (m >= 1 && m <= 12) result.month = m;
    }
  }

  if (result.month === undefined) {
    const combo = raw.match(/(\d{1,2})\s*[/\-]\s*(20\d{2})|(20\d{2})\s*[/\-]\s*(\d{1,2})/);
    if (combo) {
      if (combo[1] && combo[2]) {
        result.month = Number(combo[1]);
        result.year = Number(combo[2]);
      } else if (combo[3] && combo[4]) {
        result.year = Number(combo[3]);
        result.month = Number(combo[4]);
      }
    }
  }

  for (const [alias, status] of Object.entries(STATUS_ALIASES)) {
    if (q.includes(alias.toLowerCase())) {
      result.status = status;
      break;
    }
  }

  result.consumed =
    result.month !== undefined ||
    result.year !== undefined ||
    result.status !== undefined;

  return result;
}
