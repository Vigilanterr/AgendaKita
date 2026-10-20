import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("admin");
    const { id } = await ctx.params;

    const exists = await query("SELECT 1 FROM users WHERE id = $1", [id]);
    if (exists.rows.length === 0) {
      throw new HttpError(404, "Pengguna tidak ditemukan");
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    const sets: string[] = [];
    const params: unknown[] = [];

    if (typeof body.name === "string" && body.name.trim()) {
      params.push(body.name.trim());
      sets.push(`name = $${params.length}`);
    }

    if (body.role === "student" || body.role === "teacher" || body.role === "admin") {
      if (id === admin.id && body.role !== "admin") {
        throw new HttpError(400, "Anda tidak dapat menurunkan role akun sendiri");
      }
      params.push(body.role);
      sets.push(`role = $${params.length}::user_role`);
    }

    if (body.class_id !== undefined) {
      const classId =
        body.class_id === null || body.class_id === "" ? null : Number(body.class_id);
      if (classId != null && (!Number.isInteger(classId) || classId <= 0)) {
        throw new HttpError(400, "Kelas tidak valid");
      }
      if (classId != null) {
        const classExists = await query("SELECT 1 FROM classes WHERE id = $1", [
          classId,
        ]);
        if (classExists.rows.length === 0) {
          throw new HttpError(400, "Kelas tidak ditemukan");
        }
      }
      params.push(classId);
      sets.push(`class_id = $${params.length}`);
    }

    if (sets.length === 0) {
      throw new HttpError(400, "Tidak ada perubahan untuk disimpan");
    }

    params.push(id);
    await query(`UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length}`, params);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/users/[id]/route.ts");
    return NextResponse.json(body, { status });
  }
}
