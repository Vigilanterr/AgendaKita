"use client";

import { useCallback, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import PageHeader from "@/components/layout/page-header";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Dialog from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import Table, { TableRow, type TableColumn } from "@/components/ui/table";
import EmptyState from "@/components/ui/empty-state";
import ToastRegion, { type ToastItem } from "@/components/ui/toast";
import { useApiData } from "@/lib/use-api-data";

type ClassRow = {
  id: number;
  name: string;
  archived_at: string | null;
  student_count: number;
  teacher_count: number;
  task_count: number;
};

const columns: TableColumn[] = [
  { key: "name", header: "Kelas" },
  { key: "students", header: "Siswa", align: "right" },
  { key: "teachers", header: "Guru", align: "right" },
  { key: "tasks", header: "Tugas", align: "right" },
  { key: "actions", header: "Aksi", align: "right" },
];

export default function AdminClassesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((tone: ToastItem["tone"], message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), tone, message }]);
  }, []);

  const {
    data: listData,
    loading,
    error: loadError,
    reload: reloadList,
  } = useApiData<ClassRow[]>("/api/admin/classes");
  const classes = Array.isArray(listData) ? listData : [];

  const openCreate = () => {
    setEditing(null);
    setName("");
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (row: ClassRow) => {
    setEditing(row);
    setName(row.name);
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const res = editing
        ? await fetch(`/api/admin/classes/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          })
        : await fetch("/api/admin/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name }),
          });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormError(data?.error || "Gagal menyimpan kelas.");
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setSaving(false);
      pushToast("success", editing ? "Kelas diperbarui." : "Kelas dibuat.");
      reloadList();
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
      setSaving(false);
    }
  };

  const toggleArchive = async (row: ClassRow) => {
    try {
      const res = await fetch(`/api/admin/classes/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !row.archived_at }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        pushToast("error", data?.error || "Gagal mengubah status kelas.");
        return;
      }
      pushToast(
        "success",
        row.archived_at ? "Kelas diaktifkan kembali." : "Kelas diarsipkan."
      );
      reloadList();
    } catch {
      pushToast("error", "Tidak dapat terhubung ke server.");
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title="Kelas"
        description="Kelas aktif dipakai untuk penugasan mengajar dan penempatan siswa."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            Tambah kelas
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
      ) : classes.length === 0 ? (
        <EmptyState
          title="Belum ada kelas"
          description="Tambahkan kelas agar guru dapat ditugaskan mengajar."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              Tambah kelas
            </Button>
          }
        />
      ) : (
        <Table columns={columns} caption="Daftar kelas">
          {classes.map((row) => (
            <TableRow key={row.id} columns={columns}>
              <span className="font-medium text-ink">
                {row.name}
                {row.archived_at && (
                  <Badge tone="neutral" className="ml-2">
                    Diarsipkan
                  </Badge>
                )}
              </span>
              <span className="text-ink-2">{row.student_count}</span>
              <span className="text-ink-2">{row.teacher_count}</span>
              <span className="text-ink-2">{row.task_count}</span>
              <span className="flex justify-end gap-1.5">
                <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                  Ubah
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleArchive(row)}>
                  {row.archived_at ? "Aktifkan" : "Arsipkan"}
                </Button>
              </span>
            </TableRow>
          ))}
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Ubah nama kelas" : "Tambah kelas"}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </div>
          )}
          <Field label="Nama kelas" htmlFor="class-name" required>
            <Input
              id="class-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={60}
              placeholder="Contoh: XII RPL 1"
            />
          </Field>
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
