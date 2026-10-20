import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, errorResponse, HttpError } from "@/lib/authz";
import { getTeacherAssignments } from "@/lib/authz";

export type TaskRow = {
  id: number;
  title: string;
  description: string | null;
  class_id: number;
  teacher_id: string | null;
  subject_id: number | null;
  details: TaskDetail[];
  due_date: string;
  reminder_offset_hours: number;
  is_notified: boolean;
  reminder_sent_at: string | null;
  created_at: string;
  class_name: string;
  teacher_name: string;
  subject_name: string | null;
  subject_code: string | null;
};

export type TaskDetail = {
  key: string;
  value: string;
};

export async function GET() {
  try {
    const user = await requireUser();

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (user.role === "student") {
      if (user.class_id == null) {
        return NextResponse.json([], { status: 200 });
      }
      params.push(user.class_id);
      conditions.push(`t.class_id = $${params.length}`);
    } else if (user.role === "teacher") {
      const assignments = await getTeacherAssignments(user.id);
      if (assignments.length === 0) {
        return NextResponse.json([], { status: 200 });
      }
      params.push(assignments.map((a) => a.class_id));
      conditions.push(`t.class_id = ANY($${params.length}::int[])`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await query<TaskRow>(
      `SELECT
         t.id,
         t.title,
         t.description,
         t.class_id,
         t.teacher_id,
         t.subject_id,
         t.details,
         t.due_date AT TIME ZONE 'Asia/Jakarta' AS due_date,
         t.reminder_offset_hours,
         t.is_notified,
         t.reminder_sent_at,
         t.created_at,
         c.name AS class_name,
         u.name AS teacher_name,
         s.name AS subject_name,
         s.code AS subject_code
       FROM tasks t
       JOIN classes c ON t.class_id = c.id
       JOIN users u ON t.teacher_id = u.id
       LEFT JOIN subjects s ON t.subject_id = s.id
       ${where}
       ORDER BY
         CASE WHEN t.due_date < (NOW() AT TIME ZONE 'Asia/Jakarta') THEN 1 ELSE 0 END,
         t.due_date ASC`,
      params
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "teacher" && user.role !== "admin") {
      throw new HttpError(403, "Hanya guru yang dapat membuat tugas");
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const { parseTaskInput } = await import("@/lib/tasks");
    const parsed = parseTaskInput(body);
    if (!parsed.ok) throw new HttpError(400, parsed.error);

    const { title, description, classId, dueDate, reminderOffsetHours, subjectId } =
      parsed.value;

    const classExists = await query(
      "SELECT 1 FROM classes WHERE id = $1 AND archived_at IS NULL",
      [classId]
    );
    if (classExists.rows.length === 0) {
      throw new HttpError(400, "Kelas tidak ditemukan");
    }

    if (user.role === "teacher") {
      const { teacherTeachesClass } = await import("@/lib/authz");
      const allowed = await teacherTeachesClass(user.id, classId, subjectId);
      if (!allowed) {
        throw new HttpError(
          403,
          "Anda tidak ditugaskan mengajar kelas dan mata pelajaran ini"
        );
      }
    }

    const details = JSON.stringify(
      Array.isArray(body.details) ? body.details : []
    );

    const result = await query<{ id: number; title: string }>(
      `INSERT INTO tasks (title, description, class_id, teacher_id, subject_id, due_date, reminder_offset_hours, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING id, title`,
      [
        title,
        description,
        classId,
        user.id,
        subjectId ?? null,
        dueDate,
        reminderOffsetHours,
        details,
      ]
    );

    await notifyClassStudents(classId, result.rows[0].id, title, user.name);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/route.ts");
    return NextResponse.json(body, { status });
  }
}

async function notifyClassStudents(
  classId: number,
  taskId: number,
  taskTitle: string,
  teacherName: string
) {
  const { rows } = await query<{ id: string }>(
    `SELECT id FROM users WHERE class_id = $1 AND role = 'student'`,
    [classId]
  );

  if (rows.length === 0) return;

  const values: string[] = [];
  const params: unknown[] = [];

  rows.forEach((student, index) => {
    const base = index * 4;
    values.push(
      `($${base + 1}, $${base + 2}, 'task_published', $${base + 3}, $${base + 4})`
    );
    params.push(
      student.id,
      taskId,
      `Tugas baru: ${taskTitle}`,
      `Diterbitkan oleh ${teacherName}`
    );
  });

  await query(
    `INSERT INTO notifications (user_id, task_id, kind, title, body)
     VALUES ${values.join(", ")}`,
    params
  );
}
