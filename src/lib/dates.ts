export function todayISO(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function parseISODate(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function addDays(iso: string, days: number): string {
  const parsed = parseISODate(iso);
  if (!parsed) return iso;
  const date = new Date(parsed.year, parsed.month - 1, parsed.day);
  date.setDate(date.getDate() + days);
  return todayISO(date);
}

export function formatCzechDate(iso: string): string {
  const parsed = parseISODate(iso);
  if (!parsed) return "";
  return `${parsed.day}. ${parsed.month}. ${parsed.year}`;
}

export function isIsoDate(value: string): boolean {
  return parseISODate(value) !== null;
}
