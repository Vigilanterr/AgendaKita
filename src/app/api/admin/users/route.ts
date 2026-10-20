import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  class_id: number | null;
  class_name: string | null;
  created_at: string;
};

export async function GET(req: Request) {
  try {
    await requireRole("admin");

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    const params: unknown[] = [];
    let where = "";
    if (role === "student" || role === "teacher" || role === "admin") {
      params.push(role);
      where = `WHERE u.role = $${params.length}::user_role`;
    }

    const { rows } = await query<AdminUserRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role::text AS role,
         u.class_id,
         c.name AS class_name,
         u.created_at
       FROM users u
       LEFT JOIN classes c ON c.id = u.class_id
       ${where}
       ORDER BY u.role::text ASC, c.name ASC NULLS LAST, u.name ASC
       LIMIT 300`,
      params
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/users/route.ts");
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

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role =
      body.role === "admin"
        ? "admin"
        : body.role === "student"
          ? "student"
          : "teacher";
    const classId = body.class_id ? Number(body.class_id) : null;

    if (!name) throw new HttpError(400, "Nama wajib diisi");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new HttpError(400, "Format email tidak valid");
    }
    if (password.length < 8) {
      throw new HttpError(400, "Password minimal 8 karakter");
    }
    if (classId != null && (!Number.isInteger(classId) || classId <= 0)) {
      throw new HttpError(400, "Kelas tidak valid");
    }

    const existing = await query("SELECT 1 FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      throw new HttpError(409, "Email tersebut sudah terdaftar");
    }

    const { auth } = await import("@/lib/auth");

    try {
      await auth.api.signUpEmail({
        body: { email, password, name },
      });
    } catch {
      throw new HttpError(400, "Gagal membuat akun. Periksa kembali data yang diisi.");
    }

    const created = await query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    const userId = created.rows[0]?.id;
    if (!userId) {
      throw new HttpError(500, "Gagal membuat akun");
    }

    await query(
      `UPDATE users SET role = $1::user_role, class_id = $2 WHERE id = $3`,
      [role, classId, userId]
    );

    await query("DELETE FROM sessions WHERE user_id = $1", [userId]);

    return NextResponse.json({ ok: true, id: userId }, { status: 201 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/users/route.ts");
    return NextResponse.json(body, { status });
  }
}
