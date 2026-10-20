import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await query<{ id: number; name: string }>(
      `SELECT id, name FROM classes WHERE archived_at IS NULL ORDER BY name ASC`
    );
    return NextResponse.json(rows, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil daftar kelas" }, { status: 500 });
  }
}
