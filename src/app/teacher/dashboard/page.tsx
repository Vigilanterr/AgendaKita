"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import TeacherShell from "@/components/teacher/teacher-shell";
import PageHeader from "@/components/layout/page-header";
import Badge from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import Table, { TableRow, type TableColumn } from "@/components/ui/table";
import { useApiData } from "@/lib/use-api-data";
import { formatDateTimeWIB, formatRelative } from "@/lib/format";

type Monitoring = {
  totals: {
    total_tasks: number;
    active_tasks: number;
    overdue_tasks: number;
    reminders_sent: number;
    due_today: number;
    due_this_week: number;
    drafts: number;
    total_students: number;
    total_classes: number;
  };
  per_class: {
    class_id: number;
    class_name: string;
    students_count: number;
    tasks_total: number;
    tasks_active: number;
    tasks_overdue: number;
    reminders_sent: number;
  }[];
  upcoming: {
    id: number;
    title: string;
    class_name: string;
    subject_name: string | null;
    due_date: string;
    is_notified: boolean;
  }[];
};

type Discussion = {
  id: number;
  task_id: number;
  body: string;
  created_at: string;
  author_name: string;
  task_title: string;
  class_name: string;
};

const statLabels: {
  key: keyof Monitoring["totals"];
  label: string;
  hint?: string;
}[] = [
  { key: "active_tasks", label: "Tugas aktif", hint: "deadline belum lewat" },
  { key: "due_today", label: "Tenggat hari ini" },
  { key: "due_this_week", label: "Tenggat 7 hari" },
  { key: "reminders_sent", label: "Pengingat terkirim" },
  { key: "drafts", label: "Menunggu jadwal pengingat" },
  { key: "total_students", label: "Siswa di kelasmu" },
];

const classColumns: TableColumn[] = [
  { key: "name", header: "Kelas" },
  { key: "students", header: "Siswa", align: "right" },
  { key: "total", header: "Total", align: "right" },
  { key: "active", header: "Aktif", align: "right" },
  { key: "overdue", header: "Terlewat", align: "right" },
  { key: "sent", header: "Terkirim", align: "right" },
];

export default function TeacherDashboardPage() {
  const { data } = useApiData<Monitoring>("/api/teacher/monitoring");
  const { data: discussionData } = useApiData<Discussion[]>(
    "/api/teacher/discussions"
  );
  const discussions = useMemo(
    () => (Array.isArray(discussionData) ? discussionData : []),
    [discussionData]
  );

  const [name, setName] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.user) setName(json.user.name ?? "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return (
    <TeacherShell>
      <PageHeader
        title={name ? `Halo, ${name.split(" ")[0]}` : "Dashboard guru"}
        description="Ringkasan tugas yang kamu terbitkan dan kelas yang kamu ajar."
        actions={
          <Link
            href="/teacher/tasks"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-[--dur-micro] hover:bg-accent-hover hover:border-accent-hover"
          >
            Terbitkan tugas
          </Link>
        }
      />

      {!data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {statLabels.map((stat) => (
              <div
                key={stat.key}
                className="rounded-lg border border-rule bg-surface px-4 py-3.5"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
                  {data.totals[stat.key]}
                </p>
                {stat.hint && (
                  <p className="mt-0.5 text-xs text-ink-3">{stat.hint}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Deadline terdekat
              </h2>
              {data.upcoming.length === 0 ? (
                <EmptyState
                  title="Belum ada tugas aktif"
                  description="Tugas yang kamu terbitkan akan muncul di sini beserta tenggatnya."
                  action={
                    <Link
                      href="/teacher/tasks"
                      className="text-sm font-medium text-accent underline-offset-4 hover:underline"
                    >
                      Terbitkan tugas
                    </Link>
                  }
                />
              ) : (
                <ul className="space-y-2">
                  {data.upcoming.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-lg border border-rule bg-surface px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">
                            {task.title}
                          </p>
                          <p className="mt-0.5 text-xs text-ink-3">
                            {task.class_name}
                            {task.subject_name ? ` · ${task.subject_name}` : ""}
                          </p>
                        </div>
                        <Badge tone={task.is_notified ? "info" : "neutral"}>
                          {task.is_notified ? "Terkirim" : "Belum"}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-ink-3">
                        {formatDateTimeWIB(task.due_date)} WIB ·{" "}
                        {formatRelative(task.due_date)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Aktivitas diskusi terbaru
              </h2>
              {discussions.length === 0 ? (
                <EmptyState
                  title="Belum ada pertanyaan"
                  description="Pertanyaan siswa pada tugasmu akan muncul di sini."
                />
              ) : (
                <ul className="space-y-2">
                  {discussions.slice(0, 4).map((discussion) => (
                    <li
                      key={discussion.id}
                      className="rounded-lg border border-rule bg-surface px-4 py-3"
                    >
                      <p className="text-xs text-ink-3">
                        <span className="font-medium text-ink-2">
                          {discussion.author_name}
                        </span>{" "}
                        pada {discussion.task_title} · {discussion.class_name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-ink-2">
                        {discussion.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/teacher/discussions"
                className="mt-3 inline-block text-sm font-medium text-accent underline-offset-4 transition-colors hover:underline"
              >
                Lihat semua diskusi
              </Link>
            </section>
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Kelas yang kamu ajar
            </h2>
            {data.per_class.length === 0 ? (
              <EmptyState
                title="Belum ada penugasan"
                description="Admin perlu menugaskanmu ke kelas dan mata pelajaran sebelum kamu bisa menerbitkan tugas."
              />
            ) : (
              <Table columns={classColumns} caption="Rekap kelas yang diajar">
                {data.per_class.map((row) => (
                  <TableRow key={row.class_id} columns={classColumns}>
                    <span className="font-medium text-ink">{row.class_name}</span>
                    <span className="tabular-nums text-ink-2">
                      {row.students_count}
                    </span>
                    <span className="tabular-nums text-ink-2">
                      {row.tasks_total}
                    </span>
                    <span className="tabular-nums text-success">
                      {row.tasks_active}
                    </span>
                    <span className="tabular-nums text-danger">
                      {row.tasks_overdue}
                    </span>
                    <span className="tabular-nums text-ink-2">
                      {row.reminders_sent}
                    </span>
                  </TableRow>
                ))}
              </Table>
            )}
          </section>
        </div>
      )}
    </TeacherShell>
  );
}
