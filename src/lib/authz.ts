import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { logServerError } from "@/lib/logger";

export type AppRole = "student" | "teacher" | "admin";

export type AuthedUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  class_id: number | null;
};

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function getCurrentUser(): Promise<AuthedUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const user = session.user as unknown as {
    id: string;
    name: string;
    email: string;
    role: AppRole;
    class_id?: number | null;
  };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    class_id: user.class_id ?? null,
  };
}

export async function requireUser(): Promise<AuthedUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Anda harus masuk terlebih dahulu");
  return user;
}

export async function requireRole(...roles: AppRole[]): Promise<AuthedUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new HttpError(403, "Anda tidak memiliki izin untuk tindakan ini");
  }
  return user;
}

export type Assignment = {
  id: number;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
};

export async function getTeacherAssignments(
  teacherId: string
): Promise<Assignment[]> {
  const { rows } = await query<Assignment>(
    `SELECT
       ta.id,
       ta.class_id,
       c.name AS class_name,
       ta.subject_id,
       s.name AS subject_name,
       s.code AS subject_code
     FROM teacher_assignments ta
     JOIN classes c ON c.id = ta.class_id
     JOIN subjects s ON s.id = ta.subject_id
     WHERE ta.teacher_id = $1
     ORDER BY c.name ASC, s.name ASC`,
    [teacherId]
  );
  return rows;
}

export async function teacherTeachesClass(
  teacherId: string,
  classId: number,
  subjectId?: number | null
): Promise<boolean> {
  const params: unknown[] = [teacherId, classId];
  let sql =
    "SELECT 1 FROM teacher_assignments WHERE teacher_id = $1 AND class_id = $2";
  if (subjectId != null) {
    params.push(subjectId);
    sql += " AND subject_id = $3";
  }
  const { rows } = await query(sql, params);
  return rows.length > 0;
}

export async function assertTeacherOwnsTask(
  teacherId: string,
  taskId: number
): Promise<{ id: number; class_id: number; subject_id: number | null; teacher_id: string | null }> {
  const { rows } = await query<{
    id: number;
    class_id: number;
    subject_id: number | null;
    teacher_id: string | null;
  }>("SELECT id, class_id, subject_id, teacher_id FROM tasks WHERE id = $1", [taskId]);

  const task = rows[0];
  if (!task) throw new HttpError(404, "Tugas tidak ditemukan");

  if (task.teacher_id === teacherId) return task;

  const allowed = await teacherTeachesClass(
    teacherId,
    task.class_id,
    task.subject_id
  );
  if (!allowed) {
    throw new HttpError(403, "Tugas ini berada di luar kelas yang Anda ajar");
  }
  return task;
}

export function errorResponse(error: unknown, context?: string) {
  if (error instanceof HttpError) {
    return { status: error.status, body: { error: error.message } };
  }
  if (context) {
    logServerError(context, error);
  }
  return { status: 500, body: { error: "Terjadi kesalahan pada server" } };
}
