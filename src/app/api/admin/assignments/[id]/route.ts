import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, HttpError } from "@/lib/authz";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");
    const { id } = await ctx.params;
    const assignmentId = Number(id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      throw new HttpError(400, "ID penugasan tidak valid");
    }

    const result = await query(
      "DELETE FROM teacher_assignments WHERE id = $1",
      [assignmentId]
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, "Penugasan tidak ditemukan");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/assignments/[id]/route.ts");
    return NextResponse.json(body, { status });
  }
}
