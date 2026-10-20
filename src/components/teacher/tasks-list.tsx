"use client";

import { useState } from "react";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import EmptyState from "@/components/ui/empty-state";
import TaskDetailDialog, {
  type TaskDetailData,
} from "@/components/tasks/task-detail-dialog";
import { formatDateTimeWIB, isOverdue } from "@/lib/format";

export default function TasksList({
  tasks,
  classOptions,
  currentUserId,
  onEdit,
  onDelete,
}: {
  tasks: TaskDetailData[];
  classOptions: { id: number; name: string }[];
  currentUserId: string;
  onEdit: (task: TaskDetailData) => void;
  onDelete: (task: TaskDetailData) => void;
}) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [openTask, setOpenTask] = useState<TaskDetailData | null>(null);

  const filtered = tasks.filter((task) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      task.title.toLowerCase().includes(query) ||
      (task.subject_name ?? "").toLowerCase().includes(query);
    const matchesClass = !classFilter || task.class_id === Number(classFilter);
    const overdue = isOverdue(task.due_date);
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && !overdue) ||
      (statusFilter === "overdue" && overdue);
    return matchesSearch && matchesClass && matchesStatus;
  });

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="Belum ada tugas"
        description="Terbitkan tugas pertama untuk kelas yang kamuampu. Siswa akan melihatnya di kalender mereka."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari judul atau mata pelajaran..."
          aria-label="Cari tugas"
          className="w-full sm:w-64"
        />
        <Select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          aria-label="Filter kelas"
          className="w-auto"
        >
          <option value="">Semua kelas</option>
          {classOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Filter status"
          className="w-auto"
        >
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="overdue">Terlewat</option>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface">
        <ul className="divide-y divide-rule">
          {filtered.map((task) => {
            const overdue = isOverdue(task.due_date);
            const confirming = confirmId === task.id;
            return (
              <li key={task.id} className="px-4 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setOpenTask(task)}
                      className="text-left text-sm font-medium text-ink underline-offset-2 hover:underline"
                    >
                      {task.title}
                    </button>
                    <p className="mt-0.5 text-xs text-ink-3">
                      {task.class_name}
                      {task.subject_name ? ` · ${task.subject_name}` : ""} ·{" "}
                      {formatDateTimeWIB(task.due_date)} WIB
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={overdue ? "danger" : "accent"}>
                      {overdue ? "Terlewat" : "Aktif"}
                    </Badge>
                    <Badge tone={task.is_notified ? "info" : "neutral"}>
                      {task.is_notified ? "Terkirim" : "Belum"}
                    </Badge>

                    {confirming ? (
                      <span className="inline-flex gap-1.5">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            onDelete(task);
                            setConfirmId(null);
                          }}
                        >
                          Hapus
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Batal
                        </Button>
                      </span>
                    ) : (
                      <span className="inline-flex gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEdit(task)}
                        >
                          Ubah
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(task.id)}
                        >
                          Hapus
                        </Button>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-ink-3">
              Tidak ada tugas yang cocok dengan filter.
            </li>
          )}
        </ul>
      </div>

      <TaskDetailDialog
        task={openTask}
        currentUserId={currentUserId}
        onClose={() => setOpenTask(null)}
      />
    </div>
  );
}
