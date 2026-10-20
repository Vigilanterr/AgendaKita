"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import AgendaCalendar, {
  type CalendarTaskMark,
} from "@/components/student/agenda-calendar";
import NotificationBell from "@/components/notifications/notification-bell";
import TaskDetailDialog, {
  type TaskDetailData,
} from "@/components/tasks/task-detail-dialog";
import Badge from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { addMonths, toWibDateKey } from "@/lib/calendar";
import { formatDateTimeWIB, formatDateWIB, formatRelative, isOverdue } from "@/lib/format";
import { useApiData } from "@/lib/use-api-data";

type TaskItem = TaskDetailData;

export default function StudentAgendaView({
  todayKey,
  now,
}: {
  todayKey: string;
  now: number;
}) {
  const router = useRouter();
  const { data, loading, error } = useApiData<TaskItem[]>("/api/tasks");
  const tasks = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [month, setMonth] = useState(() => {
    const [year, monthIndex] = todayKey.split("-").map(Number);
    return { year, month: monthIndex - 1 };
  });
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [openTask, setOpenTask] = useState<TaskDetailData | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.user) return;
        setUserName(data.user.name ?? "");
        setUserId(data.user.id ?? "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const marks = useMemo(() => {
    const map: Record<string, CalendarTaskMark> = {};

    tasks.forEach((task) => {
      const key = toWibDateKey(task.due_date);
      const time = new Date(task.due_date).getTime();
      const overdue = time <= now;
      const existing = map[key];

      if (!existing) {
        map[key] = { key, count: 1, nearest: true, overdue, nearestTime: time };
        return;
      }

      existing.count += 1;
      if (time < existing.nearestTime) {
        existing.nearestTime = time;
        existing.nearest = true;
      }
      if (!overdue) {
        existing.overdue = false;
      }
    });

    return map;
  }, [tasks, now]);

  const selectedTasks = useMemo(() => {
    if (!selectedKey) return [];
    return tasks
      .filter((task) => toWibDateKey(task.due_date) === selectedKey)
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
  }, [tasks, selectedKey]);

  const upcoming = useMemo(
    () =>
      tasks
        .filter((task) => new Date(task.due_date).getTime() > now)
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        .slice(0, 4),
    [tasks, now]
  );

  const handleSignOut = () => {
    signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  return (
    <div className="min-h-dvh bg-paper app-font text-ink">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-ink">
              {userName ? `Halo, ${userName.split(" ")[0]}` : "Agenda Saya"}
            </p>
            <p className="truncate text-xs text-ink-3">
              {formatDateWIB(new Date(now).toISOString())} · Agenda tugas kelas
              kamu
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-rule bg-surface px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
            Agenda tugas kamu
          </h1>
          <p className="mt-1 text-sm text-ink-3">
            Pilih tanggal pada kalender untuk melihat tugas pada tanggal tersebut.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            {loading ? (
              <Skeleton className="h-[26rem] w-full" />
            ) : (
              <>
                <AgendaCalendar
                  year={month.year}
                  month={month.month}
                  todayKey={todayKey}
                  marks={marks}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                  onPrev={() =>
                    setMonth((prev) => addMonths(prev.year, prev.month, -1))
                  }
                  onNext={() =>
                    setMonth((prev) => addMonths(prev.year, prev.month, 1))
                  }
                  onToday={() => {
                    setMonth({
                      year: Number(todayKey.split("-")[0]),
                      month: Number(todayKey.split("-")[1]) - 1,
                    });
                    setSelectedKey(todayKey);
                  }}
                />

                <section className="rounded-lg border border-rule bg-surface">
                  <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
                    <h2 className="text-sm font-semibold text-ink">
                      {selectedTasks.length > 0
                        ? `${selectedTasks.length} tugas pada tanggal ini`
                        : "Tidak ada tugas pada tanggal ini"}
                    </h2>
                  </header>

                  {selectedTasks.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm text-ink-3">
                      Tidak ada tenggat tugas pada tanggal tersebut.
                    </p>
                  ) : (
                    <ul className="divide-y divide-rule">
                      {selectedTasks.map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => setOpenTask(task)}
                            className="flex w-full items-start justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink">
                                {task.title}
                              </p>
                              <p className="mt-0.5 text-xs text-ink-3">
                                {task.subject_name ?? task.class_name} ·{" "}
                                {task.teacher_name}
                              </p>
                            </div>
                            <Badge
                              tone={isOverdue(task.due_date, now) ? "danger" : "accent"}
                            >
                              {isOverdue(task.due_date, now)
                                ? "Terlewat"
                                : formatRelative(task.due_date, now)}
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-lg border border-rule bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">Tugas terdekat</h2>
              <p className="mt-0.5 text-xs text-ink-3">
                Empat tenggat yang paling dekat.
              </p>
              {upcoming.length === 0 ? (
                <p className="mt-4 text-sm text-ink-3">
                  Belum ada tugas aktif yang akan datang.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {upcoming.map((task) => (
                    <li key={task.id}>
                      <button
                        type="button"
                        onClick={() => setOpenTask(task)}
                        className="w-full rounded-md border border-rule bg-surface-2/50 px-3.5 py-3 text-left transition-colors hover:border-rule-strong hover:bg-surface-2"
                      >
                        <p className="text-sm font-medium text-ink">{task.title}</p>
                        <p className="mt-0.5 text-xs text-ink-3">
                          {formatDateTimeWIB(task.due_date)} WIB
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-rule bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">Cara kerja</h2>
              <ol className="mt-3 space-y-3 text-sm text-ink-2">
                <li className="flex gap-3">
                  <span className="font-medium text-ink-3">1.</span>
                  Guru menerbitkan tugas lengkap dengan tenggat waktu.
                </li>
                <li className="flex gap-3">
                  <span className="font-medium text-ink-3">2.</span>
                  Tugas muncul di kalender pada tanggal tenggatnya.
                </li>
                <li className="flex gap-3">
                  <span className="font-medium text-ink-3">3.</span>
                  Kamu bisa membuka detail dan bertanya lewat diskusi.
                </li>
                <li className="flex gap-3">
                  <span className="font-medium text-ink-3">4.</span>
                  Email pengingat dikirim sebelum tenggat sesuai
                  konfigurasi guru.
                </li>
              </ol>
            </section>
          </aside>
        </div>
      </main>

      <TaskDetailDialog
        task={openTask}
        currentUserId={userId}
        onClose={() => setOpenTask(null)}
      />
    </div>
  );
}
