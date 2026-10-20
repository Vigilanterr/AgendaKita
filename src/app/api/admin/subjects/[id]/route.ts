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
    const subjectId = Number(id);
    if (!Number.isInteger(subjectId) || subjectId <= 0) {
      throw new HttpError(400, "ID mata pelajaran tidak valid");
    }

    let body: { name?: unknown; code?: unknown };
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

    if (typeof body.code === "string" && body.code.trim()) {
      const code = body.code.trim().toUpperCase();
      if (!/^[A-Z0-9-]{1,24}$/.test(code)) {
        throw new HttpError(400, "Kode hanya boleh huruf, angka, dan tanda hubung");
      }
      params.push(code);
      sets.push(`code = $${params.length}`);
    }

    if (sets.length === 0) {
      throw new HttpError(400, "Tidak ada perubahan untuk disimpan");
    }

    params.push(subjectId);
    await query(
      `UPDATE subjects SET ${sets.join(", ")} WHERE id = $${params.length}`,
      params
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/subjects/[id]/route.ts");
    return NextResponse.json(body, { status });
  }
}
