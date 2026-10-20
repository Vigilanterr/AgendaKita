import Link from "next/link";
import { ArrowIcon } from "./Icons";

export function LandingCta() {
  return (
    <section className="px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-6 py-12 text-center ring-1 ring-slate-200 sm:py-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Tugas lebih teratur, hari lebih tenang.
          </h2>
          
          <p className="mt-4 max-w-xl text-base text-slate-600">
            Catat tugas, pantau tenggat waktu, dan kelola agenda sekolah dalam satu tempat. Mulai belajar lebih terencana bersama AgendaKita.
          </p>

          <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg  px-6 text-sm font-medium text-white transition-colors hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 sm:w-auto"
            >
              Daftar Gratis
              <ArrowIcon width={16} height={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}