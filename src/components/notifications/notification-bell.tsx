"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge";
import { useApiData } from "@/lib/use-api-data";

export type NotificationItem = {
  id: number;
  task_id: number | null;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationsResponse = {
  items: NotificationItem[];
  unread: number;
};

const kindLabels: Record<string, string> = {
  task_published: "Tugas baru",
  discussion_reply: "Diskusi",
  reminder: "Pengingat",
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  const { data, reload } = useApiData<NotificationsResponse>(
    "/api/notifications"
  );

  const items = (data?.items ?? []).map((item) =>
    overrides[item.id] ? { ...item, read_at: overrides[item.id] } : item
  );
  const unread = items.filter((item) => item.read_at === null).length;

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const markRead = useCallback(
    async (item: NotificationItem) => {
      setOverrides((prev) => ({
        ...prev,
        [item.id]: new Date().toISOString(),
      }));

      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
      } catch {
        reload();
      }

      if (item.task_id) {
        setOpen(false);
        router.push(`/?task=${item.task_id}`);
      }
    },
    [reload, router]
  );

  const markAllRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      reload();
    } catch {
      setOpen(false);
    }
  }, [reload]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifikasi${unread > 0 ? `, ${unread} belum dibaca` : ""}`}
        aria-expanded={open}
        className="relative rounded-md border border-rule bg-surface p-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path
            d="M10 2.5a4.5 4.5 0 00-4.5 4.5v2.2L4 12.2h12L14.5 9.2V7A4.5 4.5 0 0010 2.5zM8 14.5a2 2 0 004 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[--z-dropdown] mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-rule bg-surface shadow-[--shadow-lifted]">
          <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
            <p className="text-xs font-semibold text-ink">Notifikasi</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-medium text-accent underline-offset-2 hover:underline"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-ink-3">
                Belum ada notifikasi.
              </p>
            )}

            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markRead(item)}
                className={`block w-full border-b border-rule/70 px-4 py-3 text-left transition-colors hover:bg-surface-2 ${
                  item.read_at ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge tone={item.read_at ? "neutral" : "accent"}>
                    {kindLabels[item.kind] ?? "Info"}
                  </Badge>
                  {!item.read_at && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-accent"
                      aria-label="Belum dibaca"
                    />
                  )}
                </div>
                <p className="mt-1.5 text-sm font-medium text-ink">{item.title}</p>
                {item.body && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-3">
                    {item.body}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
