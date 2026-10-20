import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    const classId = Number(id);
    if (!Number.isInteger(classId) || classId <= 0) {
      throw new HttpError(400, "ID kelas tidak valid");
    }

    let body: { name?: unknown; archived?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    if (typeof body.name === "string" && body.name.trim()) {
      const name = body.name.trim();
      if (name.length > 60) throw new HttpError(400, "Nama kelas terlalu panjang");
      const duplicate = await query(
        "SELECT 1 FROM classes WHERE LOWER(name) = LOWER($1) AND id <> $2",
        [name, classId]
      );
      if (duplicate.rows.length > 0) {
        throw new HttpError(409, "Kelas dengan nama tersebut sudah ada");
      }
      await query("UPDATE classes SET name = $1 WHERE id = $2", [name, classId]);
    }

    if (body.archived !== undefined) {
      await query(
        body.archived === true
          ? "UPDATE classes SET archived_at = NOW() WHERE id = $1"
          : "UPDATE classes SET archived_at = NULL WHERE id = $1",
        [classId]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/classes/[id]/route.ts");
    return NextResponse.json(body, { status });
  }
}
