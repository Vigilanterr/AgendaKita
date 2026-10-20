import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, errorResponse, HttpError } from "@/lib/authz";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, commentId } = await ctx.params;

    const taskId = Number(id);
    const numericCommentId = Number(commentId);
    if (!Number.isInteger(taskId) || !Number.isInteger(numericCommentId)) {
      throw new HttpError(400, "ID tidak valid");
    }

    const { rows } = await query<{ id: number; user_id: string; task_id: number }>(
      "SELECT id, user_id, task_id FROM task_comments WHERE id = $1",
      [numericCommentId]
    );

    const comment = rows[0];
    if (!comment || comment.task_id !== taskId) {
      throw new HttpError(404, "Komentar tidak ditemukan");
    }

    const isAuthor = comment.user_id === user.id;
    if (!isAuthor && user.role !== "admin") {
      throw new HttpError(403, "Anda hanya dapat menghapus komentar sendiri");
    }

    await query("DELETE FROM task_comments WHERE id = $1", [numericCommentId]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/tasks/[id]/comments/[commentId]/route.ts");
    return NextResponse.json(body, { status });
  }
}
