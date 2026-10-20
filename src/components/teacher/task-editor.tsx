"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import KeyValueEditor, {
  type DetailRow,
} from "@/components/teacher/key-value-editor";
import type { TaskDetailData } from "@/components/tasks/task-detail-dialog";
import { toDateTimeLocalWIB } from "@/lib/format";

export type TeacherAssignment = {
  id: number;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
};

const REMINDER_OPTIONS = [
  { value: "1", label: "1 jam sebelum tenggat" },
  { value: "3", label: "3 jam sebelum tenggat" },
  { value: "24", label: "H-1 (24 jam) sebelum tenggat" },
];

export default function TaskEditor({
  assignments,
  initialTask,
  onSaved,
  onCancel,
}: {
  assignments: TeacherAssignment[];
  initialTask: TaskDetailData | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = initialTask !== null;
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [classId, setClassId] = useState(
    initialTask ? String(initialTask.class_id) : ""
  );
  const [subjectId, setSubjectId] = useState(
    initialTask?.subject_id ? String(initialTask.subject_id) : ""
  );
  const [dueDate, setDueDate] = useState(
    initialTask ? toDateTimeLocalWIB(initialTask.due_date) : ""
  );
  const [offset, setOffset] = useState(
    initialTask ? String(initialTask.reminder_offset_hours) : "24"
  );
  const [details, setDetails] = useState<DetailRow[]>(
    Array.isArray(initialTask?.details)
      ? (initialTask?.details as DetailRow[])
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const classOptions = Array.from(
    new Map(assignments.map((a) => [a.class_id, a.class_name])).entries()
  );

  const subjectOptions = assignments.filter(
    (a) => !classId || a.class_id === Number(classId)
  );

  const handleClassChange = (value: string) => {
    setClassId(value);
    const stillValid = assignments.some(
      (a) => a.class_id === Number(value) && a.subject_id === Number(subjectId)
    );
    if (!stillValid) setSubjectId("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        isEdit ? `/api/tasks/${initialTask.id}` : "/api/tasks",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            class_id: Number(classId),
            subject_id: subjectId ? Number(subjectId) : null,
            due_date: dueDate,
            reminder_offset_hours: Number(offset),
            details,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Gagal menyimpan tugas.");
        setSaving(false);
        return;
      }

      onSaved();
    } catch {
      setError("Tidak dapat terhubung ke server.");
      setSaving(false);
    }
  };

  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-rule bg-surface px-5 py-8 text-center">
        <p className="text-sm font-medium text-ink">
          Belum ada kelas yang ditugaskan
        </p>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-3">
          Hubungi admin untuk penugasan mengajar. Selama belum ada penugasan,
          kamu tidak dapat menerbitkan tugas.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-rule bg-surface p-5 shadow-[--shadow-whisper]"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            {isEdit ? "Ubah tugas" : "Terbitkan tugas baru"}
          </h2>
          <p className="mt-0.5 text-xs text-ink-3">
            {isEdit
              ? "Mengubah tenggat akan menjadwalkan ulang pengingat email."
              : "Siswa di kelas tujuan akan menerima pengingat sebelum tenggat."}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-ink-3 underline-offset-2 transition-colors hover:text-ink hover:underline"
        >
          Tutup
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-danger/25 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <Field label="Judul tugas" htmlFor="task-title" required>
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={160}
            placeholder="Contoh: Praktikum CRUD Basis Data"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Kelas" htmlFor="task-class" required>
            <Select
              id="task-class"
              value={classId}
              onChange={(event) => handleClassChange(event.target.value)}
              required
            >
              <option value="">-- Pilih kelas --</option>
              {classOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Mata pelajaran"
            htmlFor="task-subject"
            hint="Hanya mata pelajaran yang menjadi tanggung jawabmu."
          >
            <Select
              id="task-subject"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
              disabled={!classId}
            >
              <option value="">-- Pilih mata pelajaran --</option>
              {subjectOptions.map((assignment) => (
                <option key={assignment.subject_id} value={assignment.subject_id}>
                  {assignment.subject_name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Tenggat (WIB)" htmlFor="task-due" required>
            <Input
              id="task-due"
              type="datetime-local"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </Field>

          <Field label="Kirim email pengingat" htmlFor="task-reminder">
            <Select
              id="task-reminder"
              value={offset}
              onChange={(event) => setOffset(event.target.value)}
            >
              {REMINDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Deskripsi"
          htmlFor="task-description"
          hint="Instruksi pengerjaan untuk siswa."
        >
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            placeholder="Tuliskan detail instruksi pengerjaan tugas di sini..."
          />
        </Field>

        <Field
          label="Ketentuan tambahan"
          hint="Contoh: Format - PDF. Panjang laporan - Minimal 5 halaman."
        >
          <KeyValueEditor rows={details} onChange={setDetails} disabled={saving} />
        </Field>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-rule pt-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving
            ? "Menyimpan..."
            : isEdit
              ? "Simpan perubahan"
              : "Terbitkan tugas"}
        </Button>
      </div>
    </form>
  );
}
