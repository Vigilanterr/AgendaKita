"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import PageHeader from "@/components/layout/page-header";
import Badge from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { formatDateTimeWIB } from "@/lib/format";

type Overview = {
  totals: {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    tasks: number;
    pending_discussions: number;
  };
  recent_tasks: {
    id: number;
    title: string;
    class_name: string;
    subject_name: string | null;
    due_date: string;
    teacher_name: string;
  }[];
  recent_assignments: {
    id: number;
    teacher_name: string;
    class_name: string;
    subject_name: string;
  }[];
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError("Gagal memuat overview."));
  }, []);

  const cards = data
    ? [
        { label: "Siswa", value: data.totals.students },
        { label: "Guru", value: data.totals.teachers },
        { label: "Kelas", value: data.totals.classes },
        { label: "Mata pelajaran", value: data.totals.subjects },
        { label: "Tugas", value: data.totals.tasks },
        {
          label: "Diskusi perlu tanggapan",
          value: data.totals.pending_discussions,
        },
      ]
    : [];

  return (
    <AdminShell>
      <PageHeader
        title="Overview"
        description="Ringkasan data master dan aktivitas terbaru di AgendaKita."
      />

      {error && (
        <div className="mb-5 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className="rounded-lg border border-rule bg-surface px-4 py-3.5"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-3">
                  {card.label}
                </p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Tugas terbaru
              </h2>
              {data.recent_tasks.length === 0 ? (
                <EmptyState
                  title="Belum ada tugas"
                  description="Tugas yang diterbitkan guru akan tampil di sini."
                />
              ) : (
                <ul className="space-y-2">
                  {data.recent_tasks.map((task) => (
                    <li
                      key={task.id}
                      className="rounded-md border border-rule bg-surface px-4 py-3"
                    >
                      <p className="text-sm font-medium text-ink">{task.title}</p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {task.class_name}
                        {task.subject_name ? ` · ${task.subject_name}` : ""} ·{" "}
                        {task.teacher_name}
                      </p>
                      <p className="mt-1 text-xs text-ink-3">
                        Tenggat {formatDateTimeWIB(task.due_date)} WIB
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink">
                Penugasan terbaru
              </h2>
              {data.recent_assignments.length === 0 ? (
                <EmptyState
                  title="Belum ada penugasan"
                  description="Tetapkan guru ke kelas dan mata pelajaran agar mereka bisa menerbitkan tugas."
                />
              ) : (
                <ul className="space-y-2">
                  {data.recent_assignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-rule bg-surface px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {assignment.teacher_name}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-3">
                          {assignment.class_name}
                        </p>
                      </div>
                      <Badge tone="neutral">{assignment.subject_name}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
