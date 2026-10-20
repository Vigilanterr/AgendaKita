import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export async function GET() {
  try {
    await requireRole("admin");

    const { rows } = await query<{
      id: number;
      name: string;
      archived_at: string | null;
      student_count: string;
      teacher_count: string;
      task_count: string;
    }>(
      `SELECT
         c.id,
         c.name,
         c.archived_at,
         (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id AND u.role = 'student') AS student_count,
         (SELECT COUNT(*) FROM teacher_assignments ta WHERE ta.class_id = c.id) AS teacher_count,
         (SELECT COUNT(*) FROM tasks t WHERE t.class_id = c.id) AS task_count
       FROM classes c
       ORDER BY c.archived_at NULLS FIRST, c.name ASC
       LIMIT 200`
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        archived_at: row.archived_at,
        student_count: Number(row.student_count),
        teacher_count: Number(row.teacher_count),
        task_count: Number(row.task_count),
      })),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/classes/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");

    let body: { name?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw new HttpError(400, "Nama kelas wajib diisi");
    if (name.length > 60) throw new HttpError(400, "Nama kelas terlalu panjang");

    const duplicate = await query(
      "SELECT 1 FROM classes WHERE LOWER(name) = LOWER($1)",
      [name]
    );
    if (duplicate.rows.length > 0) {
      throw new HttpError(409, "Kelas dengan nama tersebut sudah ada");
    }

    const result = await query<{ id: number }>(
      "INSERT INTO classes (name) VALUES ($1) RETURNING id",
      [name]
    );

    return NextResponse.json({ ok: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/classes/route.ts");
    return NextResponse.json(body, { status });
  }
}
