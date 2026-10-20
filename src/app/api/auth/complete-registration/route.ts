import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { dashboardForRole, getProfileStatus } from "@/lib/profile";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getProfileStatus(session.user.id);

  if (!status) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const needsClass = status.class_id == null;
  const needsPassword = !status.has_password;

  if (!needsClass && !needsPassword) {
    return NextResponse.json({
      ok: true,
      redirect: dashboardForRole(status.role),
    });
  }

  let body: { class_id?: number; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const classId = body.class_id;
  const password = body.password;

  if (needsClass && (!classId || !Number.isInteger(classId))) {
    return NextResponse.json(
      { error: "Silakan pilih kelas terlebih dahulu." },
      { status: 400 }
    );
  }

  if (needsPassword && (!password || password.length < 8)) {
    return NextResponse.json(
      { error: "Password minimal 8 karakter." },
      { status: 400 }
    );
  }

  if (classId) {
    const { rows } = await query("SELECT 1 FROM classes WHERE id = $1", [classId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 400 });
    }
  }

  if (needsPassword && password) {
    try {
      await auth.api.setPassword({
        body: { newPassword: password },
        headers: request.headers,
      });
    } catch {
      return NextResponse.json(
        { error: "Gagal menyetel password. Silakan coba lagi." },
        { status: 400 }
      );
    }
  }

  if (classId) {
    await query(
      "UPDATE users SET class_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [classId, session.user.id]
    );
  }

  const updated = await getProfileStatus(session.user.id);

  return NextResponse.json({
    ok: true,
    redirect: dashboardForRole(updated?.role ?? status.role),
  });
}
