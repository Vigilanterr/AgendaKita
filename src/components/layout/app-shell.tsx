"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import NotificationBell from "@/components/notifications/notification-bell";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

function NavLinks({
  sections,
  onNavigate,
}: {
  sections: NavSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
            {section.title}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-[--dur-micro] ${
                      active
                        ? "bg-accent-soft font-medium text-accent-ink"
                        : "text-ink-2 hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    <span
                      className={`transition-colors ${
                        active ? "text-accent" : "text-ink-3 group-hover:text-ink-2"
                      }`}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default function AppShell({
  sections,
  userName,
  roleLabel,
  children,
  headerTitle,
}: {
  sections: NavSection[];
  userName: string;
  roleLabel: string;
  children: React.ReactNode;
  headerTitle?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = () => {
    signOut({
      fetchOptions: { onSuccess: () => router.push("/login") },
    });
  };

  return (
    <div className="min-h-dvh bg-paper app-font text-ink">
      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-rule bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
          <div className="flex items-center gap-2.5 border-b border-rule px-5 py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
              A
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">
              AgendaKita
            </span>
          </div>

          <NavLinks sections={sections} />

          <div className="border-t border-rule px-5 py-4">
            <p className="truncate text-sm font-medium text-ink">{userName}</p>
            <p className="mt-0.5 truncate text-xs text-ink-3">{roleLabel}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 text-xs font-medium text-ink-2 underline-offset-2 transition-colors hover:text-danger hover:underline"
            >
              Keluar
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-[--z-sticky] flex items-center justify-between gap-3 border-b border-rule bg-paper/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Buka navigasi"
                className="rounded-lg border border-rule bg-surface p-2 text-ink-2 transition-colors hover:bg-surface-2 lg:hidden"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M3 5h14M3 10h14M3 15h14"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
              <div className="min-w-0">
                {headerTitle && (
                  <p className="truncate text-sm font-semibold text-ink">
                    {headerTitle}
                  </p>
                )}
                <p className="truncate text-xs text-ink-3 lg:hidden">
                  {userName}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <NotificationBell />
            </div>
          </header>

          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[--z-modal] lg:hidden">
          <button
            type="button"
            aria-label="Tutup navigasi"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 cursor-default bg-ink/30"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,84vw)] flex-col border-r border-rule bg-surface">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <span className="text-sm font-semibold tracking-tight text-ink">
                AgendaKita
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup"
                className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 5l10 10M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
            </div>
            <NavLinks sections={sections} onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-rule px-5 py-4">
              <p className="truncate text-sm font-medium text-ink">{userName}</p>
              <p className="mt-0.5 truncate text-xs text-ink-3">{roleLabel}</p>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-3 text-xs font-medium text-ink-2 underline-offset-2 transition-colors hover:text-danger hover:underline"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
