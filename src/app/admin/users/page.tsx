"use client";

import { useCallback, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import PageHeader from "@/components/layout/page-header";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import Dialog from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import Table, { TableRow, type TableColumn } from "@/components/ui/table";
import EmptyState from "@/components/ui/empty-state";
import ToastRegion, { type ToastItem } from "@/components/ui/toast";
import { useApiData } from "@/lib/use-api-data";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  class_id: number | null;
  class_name: string | null;
  created_at: string;
};

type ClassRow = { id: number; name: string };

const roleLabels: Record<string, string> = {
  admin: "Admin",
  teacher: "Guru",
  student: "Siswa",
};

const columns: TableColumn[] = [
  { key: "name", header: "Nama" },
  { key: "email", header: "Email" },
  { key: "role", header: "Peran" },
  { key: "class", header: "Kelas" },
];

export default function AdminUsersPage() {
  const {
    data: userData,
    loading,
    error: loadError,
    reload: reloadUsers,
  } = useApiData<UserRow[]>("/api/admin/users");
  const { data: classData } = useApiData<ClassRow[]>("/api/classes");

  const users = Array.isArray(userData) ? userData : [];
  const classes = Array.isArray(classData) ? classData : [];

  const [roleFilter, setRoleFilter] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [classId, setClassId] = useState("");

  const pushToast = useCallback((tone: ToastItem["tone"], message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), tone, message }]);
  }, []);

  const filtered = users.filter((user) => {
    const query = search.trim().toLowerCase();
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("teacher");
    setClassId("");
    setFormError("");
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          class_id: classId ? Number(classId) : null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setFormError(data?.error || "Gagal membuat akun.");
        setSaving(false);
        return;
      }

      setDialogOpen(false);
      resetForm();
      setSaving(false);
      pushToast("success", `Akun ${name} berhasil dibuat.`);
      reloadUsers();
    } catch {
      setFormError("Tidak dapat terhubung ke server.");
      setSaving(false);
    }
  };

  const handleClassChange = async (user: UserRow, value: string) => {
    const nextClassId = value ? Number(value) : null;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class_id: nextClassId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        pushToast("error", data?.error || "Gagal mengubah kelas siswa.");
        return;
      }
      pushToast("success", `Kelas ${user.name} diperbarui.`);
      reloadUsers();
    } catch {
      pushToast("error", "Tidak dapat terhubung ke server.");
    }
  };

  return (
    <AdminShell>
      <PageHeader
        title="Pengguna"
        description="Kelola akun guru dan siswa, serta keanggotaan kelas siswa."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            Tambah akun
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama atau email..."
          aria-label="Cari pengguna"
          className="w-full sm:w-72"
        />
        <Select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          aria-label="Filter peran"
          className="w-auto"
        >
          <option value="">Semua peran</option>
          <option value="admin">Admin</option>
          <option value="teacher">Guru</option>
          <option value="student">Siswa</option>
        </Select>
      </div>

      {loadError && (
        <div className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description="Belum ada akun yang cocok dengan filter."
        />
      ) : (
        <Table columns={columns} caption="Daftar pengguna">
          {filtered.map((user) => (
            <TableRow key={user.id} columns={columns}>
              <span className="font-medium text-ink">{user.name}</span>
              <span className="text-ink-2">{user.email}</span>
              <span>
                <Badge
                  tone={
                    user.role === "admin"
                      ? "danger"
                      : user.role === "teacher"
                        ? "accent"
                        : "neutral"
                  }
                >
                  {roleLabels[user.role] ?? user.role}
                </Badge>
              </span>
              <span>
                {user.role === "student" ? (
                  <Select
                    value={user.class_id ? String(user.class_id) : ""}
                    onChange={(event) =>
                      handleClassChange(user, event.target.value)
                    }
                    aria-label={`Kelas untuk ${user.name}`}
                    className="w-auto"
                  >
                    <option value="">Tanpa kelas</option>
                    {classes.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <span className="text-ink-3">-</span>
                )}
              </span>
            </TableRow>
          ))}
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Tambah akun"
        description="Password awal dibuatkan admin dan perlu diganti pemilik akun setelah masuk."
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
              {saving ? "Menyimpan..." : "Buat akun"}
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

          <Field label="Nama lengkap" htmlFor="admin-name" required>
            <Input
              id="admin-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </Field>

          <Field label="Email" htmlFor="admin-email" required>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Password awal"
            htmlFor="admin-password"
            hint="Minimal 8 karakter. Berikan langsung ke pemilik akun."
            required
          >
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Peran" htmlFor="admin-role" required>
              <Select
                id="admin-role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="teacher">Guru</option>
                <option value="student">Siswa</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>

            <Field
              label="Kelas"
              htmlFor="admin-class"
              hint="Hanya untuk siswa."
            >
              <Select
                id="admin-class"
                value={classId}
                onChange={(event) => setClassId(event.target.value)}
                disabled={role !== "student"}
              >
                <option value="">Tanpa kelas</option>
                {classes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
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
