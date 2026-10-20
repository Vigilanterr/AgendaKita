import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  requireUser,
  errorResponse,
  HttpError,
  teacherTeachesClass,
} from "@/lib/authz";

export type CommentRow = {
  id: number;
  task_id: number;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_role: string;
};

async function resolveTaskId(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    throw new HttpError(400, "ID tugas tidak valid");
  }
  return taskId;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const taskId = await resolveTaskId(ctx);

    const task = await query<{ class_id: number; subject_id: number | null; teacher_id: string | null }>(
      "SELECT class_id, subject_id, teacher_id FROM tasks WHERE id = $1",
      [taskId]
    );

    const row = task.rows[0];
    if (!row) throw new HttpError(404, "Tugas tidak ditemukan");

    if (user.role === "student" && row.class_id !== user.class_id) {
      throw new HttpError(404, "Tugas tidak ditemukan");
    }

    if (user.role === "teacher" && row.teacher_id !== user.id) {
      const assigned = await teacherTeachesClass(
        user.id,
        row.class_id,
        row.subject_id
      );
      if (!assigned) {
        throw new HttpError(404, "Tugas tidak ditemukan");
      }
    }

    const { rows } = await query<CommentRow>(
      `SELECT
         c.id,
         c.task_id,
         c.user_id,
         c.content,
         c.created_at,
         u.name AS author_name,
         u.role::text AS author_role
       FROM task_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC, c.id ASC
       LIMIT 200`,
      [taskId]
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/[id]/comments/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const taskId = await resolveTaskId(ctx);

    const task = await query<{ class_id: number; subject_id: number | null; teacher_id: string | null; title: string }>(
      "SELECT class_id, subject_id, teacher_id, title FROM tasks WHERE id = $1",
      [taskId]
    );

    const row = task.rows[0];
    if (!row) throw new HttpError(404, "Tugas tidak ditemukan");

    if (user.role === "student" && row.class_id !== user.class_id) {
      throw new HttpError(404, "Tugas tidak ditemukan");
    }

    if (user.role === "teacher" && row.teacher_id !== user.id) {
      const assigned = await teacherTeachesClass(
        user.id,
        row.class_id,
        row.subject_id
      );
      if (!assigned) {
        throw new HttpError(404, "Tugas tidak ditemukan");
      }
    }

    let body: { body?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) throw new HttpError(400, "Pesan tidak boleh kosong");
    if (text.length > 2000) {
      throw new HttpError(400, "Pesan maksimal 2000 karakter");
    }

    const inserted = await query<CommentRow>(
      `INSERT INTO task_comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, task_id, user_id, content, created_at, $4::text AS author_name, $5::text AS author_role`,
      [taskId, user.id, text, user.name, user.role]
    );

    if (user.role === "student" && row.teacher_id) {
      const teacher = await query<{ id: string }>(
        "SELECT id FROM users WHERE id = $1",
        [row.teacher_id]
      );
      if (teacher.rows.length > 0) {
        await query(
          `INSERT INTO notifications (user_id, task_id, kind, title, body)
           VALUES ($1, $2, 'discussion_reply', $3, $4)`,
          [
            row.teacher_id,
            taskId,
            `Diskusi baru: ${row.title}`,
            `${user.name}: ${text.slice(0, 140)}`,
          ]
        );
      }
    }

    return NextResponse.json(inserted.rows[0], { status: 201 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/[id]/comments/route.ts");
    return NextResponse.json(body, { status });
  }
}
