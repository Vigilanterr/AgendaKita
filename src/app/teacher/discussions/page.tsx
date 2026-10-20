"use client";

import { useEffect, useState } from "react";
import TeacherShell from "@/components/teacher/teacher-shell";
import PageHeader from "@/components/layout/page-header";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import TaskDetailDialog, {
  type TaskDetailData,
} from "@/components/tasks/task-detail-dialog";
import { useApiData } from "@/lib/use-api-data";
import { formatDateTimeWIB } from "@/lib/format";

type Discussion = {
  id: number;
  task_id: number;
  body: string;
  created_at: string;
  author_name: string;
  author_role: string;
  task_title: string;
  class_name: string;
};

export default function TeacherDiscussionsPage() {
  const { data, loading } = useApiData<Discussion[]>(
    "/api/teacher/discussions"
  );
  const discussions = Array.isArray(data) ? data : [];

  const [userId, setUserId] = useState("");
  const [openTask, setOpenTask] = useState<TaskDetailData | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((json) => {
        if (active && json?.user) setUserId(json.user.id ?? "");
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const openTaskDialog = async (discussion: Discussion) => {
    setActiveId(discussion.task_id);
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) return;
      const tasks = await res.json();
      const found = Array.isArray(tasks)
        ? tasks.find((task: TaskDetailData) => task.id === discussion.task_id)
        : null;
      if (found) setOpenTask(found);
    } catch {
      setActiveId(null);
    }
  };

  return (
    <TeacherShell>
      <PageHeader
        title="Diskusi tugas"
        description="Pertanyaan siswa pada tugas di kelas yang kamu ajar. Buka tugasnya untuk menjawab."
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : discussions.length === 0 ? (
        <EmptyState
          title="Belum ada diskusi"
          description="Saat siswa bertanya pada sebuah tugas, pertanyaannya akan muncul di sini."
        />
      ) : (
        <ul className="space-y-3">
          {discussions.map((discussion) => (
            <li
              key={discussion.id}
              className="rounded-lg border border-rule bg-surface p-4 transition-colors hover:border-rule-strong"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="accent">{discussion.class_name}</Badge>
                  <span className="text-sm font-medium text-ink">
                    {discussion.task_title}
                  </span>
                </div>
                <span className="text-xs text-ink-3">
                  {formatDateTimeWIB(discussion.created_at)}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-2">
                {discussion.body}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3">
                <p className="text-xs text-ink-3">
                  Ditulis oleh{" "}
                  <span className="font-medium text-ink-2">
                    {discussion.author_name}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => openTaskDialog(discussion)}
                  disabled={activeId === discussion.task_id}
                  className="text-xs font-medium text-accent underline-offset-2 transition-colors hover:underline disabled:opacity-50"
                >
                  {activeId === discussion.task_id
                    ? "Memuat..."
                    : "Buka tugas & jawab"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TaskDetailDialog
        task={openTask}
        currentUserId={userId}
        onClose={() => {
          setOpenTask(null);
          setActiveId(null);
        }}
      />
    </TeacherShell>
  );
}
