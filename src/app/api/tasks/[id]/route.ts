import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  requireRole,
  errorResponse,
  HttpError,
  teacherTeachesClass,
} from "@/lib/authz";
import { parseTaskInput } from "@/lib/tasks";

async function resolveTaskId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    throw new HttpError(400, "ID tugas tidak valid");
  }
  return taskId;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("teacher", "admin");
    const taskId = await resolveTaskId(ctx);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const parsed = parseTaskInput(body);
    if (!parsed.ok) throw new HttpError(400, parsed.error);

    const {
      title,
      description,
      classId,
      subjectId,
      dueDate,
      reminderOffsetHours,
      details,
    } = parsed.value;

    const existing = await query<{
      id: number;
      teacher_id: string | null;
      class_id: number;
      subject_id: number | null;
      schedule_changed: boolean;
    }>(
      `SELECT
         id,
         teacher_id,
         class_id,
         subject_id,
         (due_date, reminder_offset_hours) IS DISTINCT FROM ($2::timestamp, $3::integer) AS schedule_changed
       FROM tasks
       WHERE id = $1`,
      [taskId, dueDate, reminderOffsetHours]
    );

    const row = existing.rows[0];
    if (!row) throw new HttpError(404, "Tugas tidak ditemukan");

    if (user.role === "teacher") {
      const owns = row.teacher_id === user.id;
      const assignedToCurrent = await teacherTeachesClass(
        user.id,
        row.class_id,
        row.subject_id
      );
      if (!owns && !assignedToCurrent) {
        throw new HttpError(
          403,
          "Tugas ini berada di luar kelas yang Anda ajar"
        );
      }

      const assignedToTarget = await teacherTeachesClass(
        user.id,
        classId,
        subjectId
      );
      if (!assignedToTarget) {
        throw new HttpError(
          403,
          "Anda tidak ditugaskan mengajar kelas dan mata pelajaran ini"
        );
      }
    }

    const classExists = await query(
      "SELECT 1 FROM classes WHERE id = $1 AND archived_at IS NULL",
      [classId]
    );
    if (classExists.rows.length === 0) {
      throw new HttpError(400, "Kelas tidak ditemukan");
    }

    if (subjectId != null) {
      const subjectExists = await query("SELECT 1 FROM subjects WHERE id = $1", [
        subjectId,
      ]);
      if (subjectExists.rows.length === 0) {
        throw new HttpError(400, "Mata pelajaran tidak ditemukan");
      }
    }

    const detailsJson = JSON.stringify(details);

    if (row.schedule_changed) {
      await query(
        `UPDATE tasks
         SET title = $1,
             description = $2,
             class_id = $3,
             subject_id = $4,
             due_date = $5,
             reminder_offset_hours = $6,
             details = $7::jsonb,
             is_notified = FALSE,
             reminder_sent_at = NULL,
             notification_status = 'pending',
             notification_attempts = 0,
             last_notification_error = NULL
         WHERE id = $8`,
        [
          title,
          description,
          classId,
          subjectId,
          dueDate,
          reminderOffsetHours,
          detailsJson,
          taskId,
        ]
      );
    } else {
      await query(
        `UPDATE tasks
         SET title = $1,
             description = $2,
             class_id = $3,
             subject_id = $4,
             details = $5::jsonb
         WHERE id = $6`,
        [title, description, classId, subjectId, detailsJson, taskId]
      );
    }

    return NextResponse.json({ ok: true, id: taskId });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/[id]/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole("teacher", "admin");
    const taskId = await resolveTaskId(ctx);

    const existing = await query<{
      teacher_id: string | null;
      class_id: number;
      subject_id: number | null;
    }>("SELECT teacher_id, class_id, subject_id FROM tasks WHERE id = $1", [
      taskId,
    ]);

    const row = existing.rows[0];
    if (!row) throw new HttpError(404, "Tugas tidak ditemukan");

    if (user.role === "teacher") {
      const owns = row.teacher_id === user.id;
      const assigned = await teacherTeachesClass(
        user.id,
        row.class_id,
        row.subject_id
      );
      if (!owns && !assigned) {
        throw new HttpError(
          403,
          "Tugas ini berada di luar kelas yang Anda ajar"
        );
      }
    }

    await query("DELETE FROM tasks WHERE id = $1", [taskId]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/[id]/route.ts");
    return NextResponse.json(body, { status });
  }
}
