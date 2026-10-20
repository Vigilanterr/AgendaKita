"use client";

import { useCallback, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import PageHeader from "@/components/layout/page-header";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Dialog from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import Table, { TableRow, type TableColumn } from "@/components/ui/table";
import EmptyState from "@/components/ui/empty-state";
import ToastRegion, { type ToastItem } from "@/components/ui/toast";
import { useApiData } from "@/lib/use-api-data";

type AssignmentRow = {
  id: number;
  teacher_id: string;
  teacher_name: string;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
};

type UserRow = { id: string; name: string; role: string };
type ClassRow = { id: number; name: string };
type SubjectRow = { id: number; name: string; code: string };

const columns: TableColumn[] = [
  { key: "teacher", header: "Guru" },
  { key: "class", header: "Kelas" },
  { key: "subject", header: "Mata pelajaran" },
  { key: "actions", header: "Aksi", align: "right" },
];

export default function AdminAssignmentsPage() {
  const {
    data: assignmentData,
    loading,
    error: loadError,
    reload: reloadAssignments,
  } = useApiData<AssignmentRow[]>("/api/admin/assignments");
  const { data: teacherData } = useApiData<UserRow[]>(
    "/api/admin/users?role=teacher"
  );
  const { data: classData } = useApiData<ClassRow[]>("/api/admin/classes");
  const { data: subjectData } = useApiData<SubjectRow[]>("/api/admin/subjects");

  const assignments = Array.isArray(assignmentData) ? assignmentData : [];
  const teachers = Array.isArray(teacherData) ? teacherData : [];
  const classes = Array.isArray(classData) ? classData : [];
  const subjects = Array.isArray(subjectData) ? subjectData : [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");

  const pushToast = useCallback((tone: ToastItem["tone"], message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), tone, message }]);
  }, []);

  const openCreate = () => {
    setTeacherId("");
    setClassId("");
    setSubjectId("");
    setFormError("");
    setDialogOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          class_id: Number(classId),
          subject_id: Number(subjectId),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormError(data?.error || "Gagal menyimpan penugasan.");
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setSaving(false);
      pushToast("success", "Penugasan mengajar dibuat.");
      reloadAssignments();
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
      setSaving(false);
    }
  };

  const handleDelete = async (row: AssignmentRow) => {
    try {
      const res = await fetch(`/api/admin/assignments/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        pushToast("error", data?.error || "Gagal menghapus penugasan.");
        return;
      }
      pushToast("success", "Penugasan dihapus.");
      reloadAssignments();
    } catch {
      pushToast("error", "Tidak dapat terhubung ke server.");
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title="Penugasan mengajar"
        description="Relasi ini yang menentukan kelas dan mata pelajaran mana yang boleh dikelola guru."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            Tambah penugasan
          </Button>
        }
      />

      {loadError && (
        <div className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          title="Belum ada penugasan"
          description="Tanpa penugasan, guru tidak dapat menerbitkan tugas."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              Tambah penugasan
            </Button>
          }
        />
      ) : (
        <Table columns={columns} caption="Daftar penugasan mengajar">
          {assignments.map((row) => (
            <TableRow key={row.id} columns={columns}>
              <span className="font-medium text-ink">{row.teacher_name}</span>
              <span className="text-ink-2">{row.class_name}</span>
              <span>
                <span className="text-ink-2">{row.subject_name}</span>
                <Badge tone="neutral" className="ml-2">
                  {row.subject_code}
                </Badge>
              </span>
              <span className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => handleDelete(row)}>
                  Hapus
                </Button>
              </span>
            </TableRow>
          ))}
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Tambah penugasan mengajar"
        description="Guru hanya bisa mengelola kelas dan mata pelajaran yang terdaftar di sini."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan penugasan"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </div>
          )}

          <Field label="Guru" htmlFor="assign-teacher" required>
            <Select
              id="assign-teacher"
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              required
            >
              <option value="">-- Pilih guru --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kelas" htmlFor="assign-class" required>
              <Select
                id="assign-class"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                required
              >
                <option value="">-- Pilih kelas --</option>
                {classes.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Mata pelajaran" htmlFor="assign-subject" required>
              <Select
                id="assign-subject"
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                required
              >
                <option value="">-- Pilih mata pelajaran --</option>
                {subjects.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </form>
      </Dialog>

      <ToastRegion
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }
      />
    </AdminShell>
  );
}
