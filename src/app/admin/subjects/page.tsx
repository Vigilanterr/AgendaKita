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

type SubjectRow = {
  id: number;
  name: string;
  code: string;
  assignment_count: number;
};

const columns: TableColumn[] = [
  { key: "name", header: "Mata pelajaran" },
  { key: "code", header: "Kode" },
  { key: "assignments", header: "Penugasan", align: "right" },
  { key: "actions", header: "Aksi", align: "right" },
];

export default function AdminSubjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectRow | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
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
  } = useApiData<SubjectRow[]>("/api/admin/subjects");
  const subjects = Array.isArray(listData) ? listData : [];

  const openCreate = () => {
    setEditing(null);
    setName("");
    setCode("");
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (row: SubjectRow) => {
    setEditing(row);
    setName(row.name);
    setCode(row.code);
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const res = editing
        ? await fetch(`/api/admin/subjects/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, code }),
          })
        : await fetch("/api/admin/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, code }),
          });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormError(data?.error || "Gagal menyimpan mata pelajaran.");
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      setSaving(false);
      pushToast("success", editing ? "Mata pelajaran diperbarui." : "Mata pelajaran dibuat.");
      reloadList();
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title="Mata pelajaran"
        description="Daftar mata pelajaran yang dipakai pada penugasan mengajar."
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            Tambah mata pelajaran
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
      ) : subjects.length === 0 ? (
        <EmptyState
          title="Belum ada mata pelajaran"
          description="Tambahkan mata pelajaran sebelum menentukan penugasan mengajar."
          action={
            <Button variant="primary" size="sm" onClick={openCreate}>
              Tambah mata pelajaran
            </Button>
          }
        />
      ) : (
        <Table columns={columns} caption="Daftar mata pelajaran">
          {subjects.map((row) => (
            <TableRow key={row.id} columns={columns}>
              <span className="font-medium text-ink">{row.name}</span>
              <span>
                <Badge tone="neutral">{row.code}</Badge>
              </span>
              <span className="text-ink-2">{row.assignment_count}</span>
              <span className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => openEdit(row)}>
                  Ubah
                </Button>
              </span>
            </TableRow>
          ))}
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editing ? "Ubah mata pelajaran" : "Tambah mata pelajaran"}
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
          <Field label="Nama mata pelajaran" htmlFor="subject-name" required>
            <Input
              id="subject-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              placeholder="Contoh: Pemrograman"
            />
          </Field>
          <Field
            label="Kode"
            htmlFor="subject-code"
            hint="Huruf, angka, atau tanda hubung. Contoh: PGR"
            required
          >
            <Input
              id="subject-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              required
              maxLength={24}
              placeholder="PGR"
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
