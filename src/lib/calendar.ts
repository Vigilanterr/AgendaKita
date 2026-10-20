export const WIB = "Asia/Jakarta";

export const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export const MONTH_LABELS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function monthLabel(year: number, month: number) {
  return `${MONTH_LABELS[month]} ${year}`;
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toWibDateKey(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function todayWibKey(): string {
  return toWibDateKey(new Date().toISOString());
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function toWibTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export type CalendarCell = {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

export function buildMonthGrid(
  year: number,
  month: number,
  todayKey: string
): CalendarCell[] {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (first.getDay() + 6) % 7;

  const cells: CalendarCell[] = [];

  for (let i = 0; i < leadingBlanks; i += 1) {
    cells.push({
      key: `pad-${i}`,
      day: 0,
      inMonth: false,
      isToday: false,
      isWeekend: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const key = dateKey(date);
    const weekday = (date.getDay() + 6) % 7;
    cells.push({
      key,
      day,
      inMonth: true,
      isToday: key === todayKey,
      isWeekend: weekday >= 5,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `pad-end-${cells.length}`,
      day: 0,
      inMonth: false,
      isToday: false,
      isWeekend: false,
    });
  }

  return cells;
}

export function addMonths(year: number, month: number, delta: number) {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}
