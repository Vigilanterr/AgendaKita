"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import PageHeader from "@/components/layout/page-header";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import Table, { TableRow, type TableColumn } from "@/components/ui/table";
import { useApiData } from "@/lib/use-api-data";
import { formatDateTimeWIB, isOverdue } from "@/lib/format";

type TaskItem = {
  id: number;
  title: string;
  class_id: number;
  class_name: string;
  teacher_name: string;
  subject_name: string | null;
  due_date: string;
  is_notified: boolean;
};

const columns: TableColumn[] = [
  { key: "title", header: "Tugas" },
  { key: "class", header: "Kelas" },
  { key: "subject", header: "Mata pelajaran" },
  { key: "teacher", header: "Guru" },
  { key: "due", header: "Tenggat" },
  { key: "status", header: "Status", align: "right" },
];

export default function AdminTasksPage() {
  const { data, loading } = useApiData<TaskItem[]>("/api/tasks");
  const tasks = useMemo(
    () => (Array.isArray(data) ? data : []),
    [data]
  );

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const classOptions = useMemo(
    () =>
      Array.from(new Map(tasks.map((t) => [t.class_id, t.class_name])).entries()),
    [tasks]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesClass = !classFilter || task.class_id === Number(classFilter);
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.teacher_name.toLowerCase().includes(query);
      return matchesClass && matchesSearch;
    });
  }, [tasks, search, classFilter]);

  return (
    <AdminShell>
      <PageHeader
        title="Tugas"
        description="Seluruh tugas yang terbit di sekolah ini. Admin memantau secara read-only; perubahan tetap dilakukan oleh guru pemilik tugas."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari judul atau guru..."
          aria-label="Cari tugas"
          className="w-full sm:w-72"
        />
        <Select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          aria-label="Filter kelas"
          className="w-auto"
        >
          <option value="">Semua kelas</option>
          {classOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada tugas"
          description="Belum ada tugas yang cocok dengan filter."
        />
      ) : (
        <Table columns={columns} caption="Daftar tugas sekolah">
          {filtered.map((task) => (
            <TableRow key={task.id} columns={columns}>
              <span className="font-medium text-ink">{task.title}</span>
              <span className="text-ink-2">{task.class_name}</span>
              <span className="text-ink-2">{task.subject_name ?? "-"}</span>
              <span className="text-ink-2">{task.teacher_name}</span>
              <span className="whitespace-nowrap text-ink-2">
                {formatDateTimeWIB(task.due_date)} WIB
              </span>
              <span className="flex justify-end">
                <Badge tone={isOverdue(task.due_date) ? "danger" : "success"}>
                  {isOverdue(task.due_date) ? "Terlewat" : "Aktif"}
                </Badge>
              </span>
            </TableRow>
          ))}
        </Table>
      )}
    </AdminShell>
  );
}
