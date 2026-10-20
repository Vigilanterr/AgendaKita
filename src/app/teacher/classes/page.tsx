"use client";

import { useEffect, useState } from "react";
import TeacherShell from "@/components/teacher/teacher-shell";
import PageHeader from "@/components/layout/page-header";
import Badge from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import Table, { TableRow, type TableColumn } from "@/components/ui/table";
import { useAssignments } from "@/components/teacher/use-assignments";

type StudentItem = {
  id: string;
  name: string;
  email: string;
  class_id: number | null;
  class_name: string | null;
};

const columns: TableColumn[] = [
  { key: "class", header: "Kelas" },
  { key: "subject", header: "Mata pelajaran" },
  { key: "code", header: "Kode" },
  { key: "students", header: "Siswa", align: "right" },
];

export default function TeacherClassesPage() {
  const { assignments, loading } = useAssignments();
  const [students, setStudents] = useState<StudentItem[]>([]);

  useEffect(() => {
    fetch("/api/students")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));
  }, []);

  const rows = assignments.map((assignment) => ({
    ...assignment,
    studentCount: students.filter(
      (student) => student.class_id === assignment.class_id
    ).length,
  }));

  return (
    <TeacherShell>
      <PageHeader
        title="Kelas saya"
        description="Penugasan mengajar ditetapkan oleh admin. Inilah satu-satunya kelas yang bisa kamu kelola."
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="Belum ada penugasan mengajar"
          description="Admin perlu menetapkan kelas dan mata pelajaran yang kamu ampu sebelum kamu bisa menerbitkan tugas."
        />
      ) : (
        <div className="space-y-6">
          <Table columns={columns} caption="Penugasan mengajar">
            {rows.map((row) => (
              <TableRow key={row.id} columns={columns}>
                <span className="font-medium text-ink">{row.class_name}</span>
                <span className="text-ink-2">{row.subject_name}</span>
                <span>
                  <Badge tone="neutral">{row.subject_code}</Badge>
                </span>
                <span className="tabular-nums text-ink-2">{row.studentCount}</span>
              </TableRow>
            ))}
          </Table>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              Siswa per kelas
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {Array.from(new Set(rows.map((row) => row.class_id))).map(
                (classId) => {
                  const label =
                    rows.find((row) => row.class_id === classId)?.class_name ??
                    "";
                  const members = students.filter(
                    (student) => student.class_id === classId
                  );
                  return (
                    <div
                      key={classId}
                      className="rounded-lg border border-rule bg-surface p-4"
                    >
                      <p className="text-sm font-semibold text-ink">{label}</p>
                      <p className="mt-0.5 text-xs text-ink-3">
                        {members.length} siswa terdaftar
                      </p>
                      {members.length === 0 ? (
                        <p className="mt-3 text-sm text-ink-3">
                          Belum ada siswa di kelas ini.
                        </p>
                      ) : (
                        <ul className="mt-3 space-y-1.5">
                          {members.map((member) => (
                            <li
                              key={member.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="truncate text-ink-2">
                                {member.name}
                              </span>
                              <span className="truncate text-xs text-ink-3">
                                {member.email}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </section>
        </div>
      )}
    </TeacherShell>
  );
}
