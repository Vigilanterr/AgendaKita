import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireUser, errorResponse, HttpError } from "@/lib/authz";

export type NotificationRow = {
  id: number;
  task_id: number | null;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const user = await requireUser();

    const { rows } = await query<NotificationRow>(
      `SELECT
         id,
         task_id,
         kind,
         title,
         body,
         read_at,
         created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 50`,
      [user.id]
    );

    const unread = rows.filter((row) => row.read_at === null).length;

    return NextResponse.json({ items: rows, unread }, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/notifications/route.ts");
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireUser();

    let body: { id?: unknown; all?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new HttpError(400, "Permintaan tidak valid");
    }

    if (body.all === true) {
      await query(
        "UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL",
        [user.id]
      );
      return NextResponse.json({ ok: true });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, "ID notifikasi tidak valid");
    }

    const result = await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2 AND read_at IS NULL`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      const exists = await query(
        "SELECT 1 FROM notifications WHERE id = $1 AND user_id = $2",
        [id, user.id]
      );
      if (exists.rows.length === 0) {
        throw new HttpError(404, "Notifikasi tidak ditemukan");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/notifications/route.ts");
    return NextResponse.json(body, { status });
  }
}
