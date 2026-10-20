import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export async function GET() {
  try {
    await requireRole("admin");

    const { rows } = await query<{
      id: number;
      name: string;
      code: string;
      assignment_count: string;
    }>(
      `SELECT
         s.id,
         s.name,
         s.code,
         (SELECT COUNT(*) FROM teacher_assignments ta WHERE ta.subject_id = s.id) AS assignment_count
       FROM subjects s
       ORDER BY s.name ASC
       LIMIT 200`
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        assignment_count: Number(row.assignment_count),
      })),
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/subjects/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    await requireRole("admin");

    let body: { name?: unknown; code?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";

    if (!name) throw new HttpError(400, "Nama mata pelajaran wajib diisi");
    if (!code) throw new HttpError(400, "Kode mata pelajaran wajib diisi");
    if (name.length > 120) throw new HttpError(400, "Nama terlalu panjang");
    if (!/^[A-Z0-9-]{1,24}$/.test(code)) {
      throw new HttpError(400, "Kode hanya boleh huruf, angka, dan tanda hubung");
    }

    const duplicate = await query(
      "SELECT 1 FROM subjects WHERE LOWER(name) = LOWER($1) OR LOWER(code) = LOWER($2)",
      [name, code]
    );
    if (duplicate.rows.length > 0) {
      throw new HttpError(409, "Mata pelajaran dengan nama atau kode tersebut sudah ada");
    }

    const result = await query<{ id: number }>(
      "INSERT INTO subjects (name, code) VALUES ($1, $2) RETURNING id",
      [name, code]
    );

    return NextResponse.json({ ok: true, id: result.rows[0].id }, { status: 201 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/subjects/route.ts");
    return NextResponse.json(body, { status });
  }
}
