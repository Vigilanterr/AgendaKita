import { WIB } from "@/lib/calendar";

export function formatDateTimeWIB(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDateWIB(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatRelative(
  iso: string,
  now: number | Date = new Date()
): string {
  const nowMs = now instanceof Date ? now.getTime() : now;
  const diff = new Date(iso).getTime() - nowMs;
  const absMinutes = Math.floor(Math.abs(diff) / 60000);
  const isFuture = diff >= 0;

  if (absMinutes < 1) return isFuture ? "kurang dari 1 menit lagi" : "baru saja";

  let span: string;
  if (absMinutes < 60) {
    span = `${absMinutes} menit`;
  } else if (absMinutes < 1440) {
    span = `${Math.floor(absMinutes / 60)} jam`;
  } else {
    span = `${Math.floor(absMinutes / 1440)} hari`;
  }

  return isFuture ? `dalam ${span}` : `${span} yang lalu`;
}

export function toDateTimeLocalWIB(iso: string): string {
  const formatted = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return formatted.replace(" ", "T");
}

export function isOverdue(
  iso: string,
  now: number | Date = new Date()
): boolean {
  const nowMs = now instanceof Date ? now.getTime() : now;
  return new Date(iso).getTime() <= nowMs;
}

export function reminderLabel(offsetHours: number): string {
  if (offsetHours === 1) return "1 jam sebelum tenggat";
  if (offsetHours === 3) return "3 jam sebelum tenggat";
  if (offsetHours === 24) return "H-1 sebelum tenggat";
  return `${offsetHours} jam sebelum tenggat`;
}
