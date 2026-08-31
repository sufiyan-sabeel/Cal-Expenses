export type ISODateString = string; // "2026-08-30"
export type ISODateTimeString = string; // "2026-08-30T14:22:00.000Z"
export type UUID = string;

export interface BaseEntity {
  id: UUID;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

export function nowIso(): ISODateTimeString {
  return new Date().toISOString();
}

export function todayISODate(): ISODateString {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function toISODate(d: Date): ISODateString {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function parseISODate(s: ISODateString): Date {
  const [y, m, day] = s.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, day);
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(amount: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount);
  } catch {
    return amount.toString();
  }
}

export function formatDate(dateStr: ISODateString, locale: string, dateFormat: string): string {
  const d = parseISODate(dateStr);
  try {
    if (dateFormat === "MDY") {
      return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(d);
    }
    if (dateFormat === "YMD") {
      return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(d);
    }
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return dateStr;
  }
}
