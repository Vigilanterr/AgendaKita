import type { ReactNode } from "react";

const previewRows = [
  { day: "05", month: "Nov", title: "Praktikum CRUD Basis Data", meta: "XI TKJ 1", time: "09.30" },
  { day: "08", month: "Nov", title: "Latihan JOIN & Subquery", meta: "XI TKJ 2", time: "13.00" },
  { day: "12", month: "Nov", title: "Portofolio kelompok", meta: "XII RPL 1", time: "10.00" },
];

export default function AuthLayout({
  children,
  headline,
  description,
  points,
}: {
  children: ReactNode;
  headline: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="grid min-h-dvh w-full grid-cols-1 bg-paper app-font text-ink lg:grid-cols-[1.05fr_1fr]">
      <aside className="app-gradient-strong relative hidden flex-col justify-between overflow-hidden px-10 py-12 lg:flex xl:px-16">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            A
          </span>
          <span className="text-base font-semibold tracking-tight text-ink">
            AgendaKita
          </span>
        </div>

        <div className="max-w-md">
          <h2 className="text-[2rem] font-bold leading-[1.2] tracking-tight text-ink">
            {headline}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-2">{description}</p>

          <ul className="mt-7 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-ink-2">
                <span
                  className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5">
                    <path
                      d="M2.5 6.2l2.3 2.3 4.7-4.9"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-sm rounded-xl border border-white/80 bg-white/85 p-4 shadow-[--shadow-lifted] backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3">
            <p className="text-xs font-semibold text-ink">November 2026</p>
            <span className="rounded-full border border-accent/20 bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-ink">
              Contoh tampilan
            </span>
          </div>
          <ul className="space-y-2.5">
            {previewRows.map((row) => (
              <li key={row.title} className="flex items-center gap-3">
                <div className="w-9 shrink-0 text-center">
                  <p className="text-sm font-semibold leading-none text-ink">
                    {row.day}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-3">
                    {row.month}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink">{row.title}</p>
                  <p className="mt-0.5 text-[10px] text-ink-3">
                    {row.meta} · {row.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex flex-col bg-surface">
        <div className="flex items-center gap-2.5 px-5 py-5 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
            A
          </span>
          <span className="text-sm font-semibold tracking-tight text-ink">
            AgendaKita
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}
