export type TaskDetail = {
  key: string;
  value: string;
};

export type ParsedTaskInput = {
  title: string;
  description: string | null;
  classId: number;
  subjectId: number | null;
  dueDate: string;
  reminderOffsetHours: number;
  details: TaskDetail[];
};

export const MAX_DETAILS = 12;
export const MAX_DETAIL_KEY = 60;
export const MAX_DETAIL_VALUE = 400;

function parseDetails(input: unknown): { details: TaskDetail[]; error?: string } {
  if (input == null) return { details: [] };
  if (!Array.isArray(input)) return { details: [], error: "Detail tugas tidak valid" };
  if (input.length > MAX_DETAILS) {
    return { details: [], error: `Maksimal ${MAX_DETAILS} detail per tugas` };
  }

  const details: TaskDetail[] = [];
  const seen = new Set<string>();

  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) {
      return { details: [], error: "Detail tugas tidak valid" };
    }
    const entry = raw as { key?: unknown; value?: unknown };
    const key = typeof entry.key === "string" ? entry.key.trim() : "";
    const value = typeof entry.value === "string" ? entry.value.trim() : "";

    if (!key && !value) continue;
    if (!key) return { details: [], error: "Nama detail wajib diisi" };
    if (!value) return { details: [], error: `Isi detail "${key}" wajib diisi` };
    if (key.length > MAX_DETAIL_KEY) {
      return { details: [], error: "Nama detail terlalu panjang" };
    }
    if (value.length > MAX_DETAIL_VALUE) {
      return { details: [], error: `Isi detail "${key}" terlalu panjang` };
    }

    const normalized = key.toLowerCase();
    if (seen.has(normalized)) {
      return { details: [], error: `Detail "${key}" duplikat` };
    }
    seen.add(normalized);
    details.push({ key, value });
  }

  return { details };
}

export function parseTaskInput(
  body: Record<string, unknown>
): { ok: true; value: ParsedTaskInput } | { ok: false; error: string } {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return { ok: false, error: "Judul tugas wajib diisi" };
  }
  if (title.length > 160) {
    return { ok: false, error: "Judul tugas maksimal 160 karakter" };
  }

  const classId = Number(body.class_id);
  if (!Number.isInteger(classId) || classId <= 0) {
    return { ok: false, error: "Kelas wajib dipilih" };
  }

  const subjectRaw = body.subject_id;
  const subjectId =
    subjectRaw == null || subjectRaw === "" ? null : Number(subjectRaw);
  if (subjectId != null && (!Number.isInteger(subjectId) || subjectId <= 0)) {
    return { ok: false, error: "Mata pelajaran tidak valid" };
  }

  const dueDate = typeof body.due_date === "string" ? body.due_date : "";
  if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
    return { ok: false, error: "Batas waktu tidak valid" };
  }

  const offsetRaw = Number(body.reminder_offset_hours);
  const reminderOffsetHours = [1, 3, 24].includes(offsetRaw) ? offsetRaw : 24;

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  const parsedDetails = parseDetails(body.details);
  if (parsedDetails.error) {
    return { ok: false, error: parsedDetails.error };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      classId,
      subjectId,
      dueDate,
      reminderOffsetHours,
      details: parsedDetails.details,
    },
  };
}
