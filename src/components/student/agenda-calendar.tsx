"use client";

import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  monthLabel,
  type CalendarCell,
} from "@/lib/calendar";

export type CalendarTaskMark = {
  key: string;
  count: number;
  nearest: boolean;
  overdue: boolean;
  nearestTime: number;
};

export default function AgendaCalendar({
  year,
  month,
  todayKey,
  marks,
  selectedKey,
  onSelect,
  onPrev,
  onNext,
  onToday,
}: {
  year: number;
  month: number;
  todayKey: string;
  marks: Record<string, CalendarTaskMark>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const cells: CalendarCell[] = buildMonthGrid(year, month, todayKey);

  return (
    <section className="overflow-hidden rounded-lg border border-rule bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
        <h2 className="text-sm font-semibold text-ink" aria-live="polite">
          {monthLabel(year, month)}
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToday}
            className="rounded-md border border-rule px-2.5 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Hari ini
          </button>
          <button
            type="button"
            onClick={onPrev}
            aria-label="Bulan sebelumnya"
            className="rounded-md border border-rule p-1.5 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M12 4l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Bulan berikutnya"
            className="rounded-md border border-rule p-1.5 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path
                d="M8 4l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-rule bg-surface-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-3"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          if (!cell.inMonth) {
            return <div key={cell.key} className="min-h-14 border-b border-r border-rule/60 sm:min-h-20" />;
          }

          const mark = marks[cell.key];
          const selected = selectedKey === cell.key;

          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelect(cell.key)}
              aria-label={`${cell.day} ${monthLabel(year, month)}${
                mark ? `, ${mark.count} tugas` : ", tidak ada tugas"
              }`}
              aria-pressed={selected}
              className={`relative min-h-14 border-b border-r border-rule/60 p-1.5 text-left transition-colors duration-[--dur-micro] sm:min-h-20 sm:p-2 ${
                selected
                  ? "bg-accent-soft"
                  : cell.isWeekend
                    ? "bg-surface-2/60 hover:bg-surface-2"
                    : "hover:bg-surface-2"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium tabular-nums ${
                  cell.isToday
                    ? "bg-accent text-white"
                    : selected
                      ? "text-accent-ink"
                      : "text-ink-2"
                }`}
              >
                {cell.day}
              </span>

              {mark && (
                <span className="mt-1 flex flex-wrap items-center gap-1">
                  {mark.nearest && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-accent"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={`text-[11px] leading-none font-medium ${
                      mark.overdue ? "text-danger" : "text-ink-3"
                    }`}
                  >
                    {mark.count} tugas
                  </span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
