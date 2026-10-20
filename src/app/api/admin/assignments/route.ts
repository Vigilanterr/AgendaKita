import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export type AssignmentRow = {
  id: number;
  teacher_id: string;
  teacher_name: string;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  subject_code: string;
};

export async function GET() {
  try {
    await requireRole("admin");

    const { rows } = await query<AssignmentRow>(
      `SELECT
         ta.id,
         ta.teacher_id,
         u.name AS teacher_name,
         ta.class_id,
         c.name AS class_name,
         ta.subject_id,
         s.name AS subject_name,
         s.code AS subject_code
       FROM teacher_assignments ta
       JOIN users u ON u.id = ta.teacher_id
       JOIN classes c ON c.id = ta.class_id
       JOIN subjects s ON s.id = ta.subject_id
       ORDER BY u.name ASC, c.name ASC, s.name ASC
       LIMIT 300`
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/assignments/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const teacherId = typeof body.teacher_id === "string" ? body.teacher_id : "";
    const classId = Number(body.class_id);
    const subjectId = Number(body.subject_id);

    if (!teacherId) throw new HttpError(400, "Guru wajib dipilih");
    if (!Number.isInteger(classId) || classId <= 0) {
      throw new HttpError(400, "Kelas wajib dipilih");
    }
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      throw new HttpError(400, "Mata pelajaran wajib dipilih");
    }

    const teacher = await query<{ id: string }>(
      "SELECT id FROM users WHERE id = $1 AND role IN ('teacher','admin')",
      [teacherId]
    );
    if (teacher.rows.length === 0) {
      throw new HttpError(400, "Guru tidak ditemukan");
    }

    const classExists = await query("SELECT 1 FROM classes WHERE id = $1", [classId]);
    if (classExists.rows.length === 0) {
      throw new HttpError(400, "Kelas tidak ditemukan");
    }

    const subjectExists = await query("SELECT 1 FROM subjects WHERE id = $1", [
      subjectId,
    ]);
    if (subjectExists.rows.length === 0) {
      throw new HttpError(400, "Mata pelajaran tidak ditemukan");
    }

    const duplicate = await query(
      `SELECT 1 FROM teacher_assignments
       WHERE teacher_id = $1 AND class_id = $2 AND subject_id = $3`,
      [teacherId, classId, subjectId]
    );
    if (duplicate.rows.length > 0) {
      throw new HttpError(409, "Penugasan tersebut sudah ada");
    }

    const result = await query<{ id: number }>(
      `INSERT INTO teacher_assignments (teacher_id, class_id, subject_id)
       VALUES ($1, $2, $3) RETURNING id`,
      [teacherId, classId, subjectId]
    );

    return NextResponse.json({ ok: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/assignments/route.ts");
    return NextResponse.json(body, { status });
  }
}
