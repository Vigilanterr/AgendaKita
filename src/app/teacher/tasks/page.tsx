"use client";

import { useEffect, useState } from "react";
import TeacherShell from "@/components/teacher/teacher-shell";
import PageHeader from "@/components/layout/page-header";
import Button from "@/components/ui/button";
import TaskEditor from "@/components/teacher/task-editor";
import TasksList from "@/components/teacher/tasks-list";
import { useAssignments } from "@/components/teacher/use-assignments";
import type { TaskDetailData } from "@/components/tasks/task-detail-dialog";
import { useApiData } from "@/lib/use-api-data";

export default function TeacherTasksPage() {
  const { assignments } = useAssignments();
  const { data, loading, error: loadError, reload } = useApiData<TaskDetailData[]>(
    "/api/tasks"
  );
  const tasks = Array.isArray(data) ? data : [];

  const [userId, setUserId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<TaskDetailData | null>(null);
  const [error, setError] = useState("");

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

  const classOptions = Array.from(
    new Map(assignments.map((a) => [a.class_id, a.class_name])).entries()
  ).map(([id, name]) => ({ id: Number(id), name: String(name) }));

  const handleDelete = async (task: TaskDetailData) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Gagal menghapus tugas.");
        return;
      }
      reload();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    }
  };

  return (
    <TeacherShell>
      <PageHeader
        title="Kelola tugas"
        description="Hanya kelas dan mata pelajaran yang menjadi tanggung jawabmu yang bisa dipilih."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            Terbitkan tugas
          </Button>
        }
      />

      {(error || loadError) && (
        <div className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error || loadError}
        </div>
      )}

      {editorOpen && (
        <div className="mb-6">
          <TaskEditor
            key={editing?.id ?? "new"}
            assignments={assignments}
            initialTask={editing}
            onSaved={() => {
              setEditorOpen(false);
              setEditing(null);
              reload();
            }}
            onCancel={() => {
              setEditorOpen(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-14 animate-pulse rounded-md bg-surface-3/70" />
          <div className="h-14 animate-pulse rounded-md bg-surface-3/70" />
        </div>
      ) : (
        <TasksList
          tasks={tasks}
          classOptions={classOptions}
          currentUserId={userId}
          onEdit={(task) => {
            setEditing(task);
            setEditorOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}
    </TeacherShell>
  );
}
