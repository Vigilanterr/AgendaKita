import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  requireRole,
  errorResponse,
  getTeacherAssignments,
} from "@/lib/authz";

export type StudentRow = {
  id: string;
  name: string;
  email: string;
  class_id: number | null;
  class_name: string | null;
  joined_at: string;
};

export async function GET() {
  try {
    const user = await requireRole("teacher", "admin");

    const params: unknown[] = [];
    let scope = "";

    if (user.role === "teacher") {
      const assignments = await getTeacherAssignments(user.id);
      if (assignments.length === 0) {
        return NextResponse.json([], { status: 200 });
      }
      params.push(assignments.map((a) => a.class_id));
      scope = "AND u.class_id = ANY($1::int[])";
    }

    const { rows } = await query<StudentRow>(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.class_id,
         c.name AS class_name,
         ((u.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta') AS joined_at
       FROM users u
       LEFT JOIN classes c ON c.id = u.class_id
       WHERE u.role = 'student' ${scope}
       ORDER BY c.name ASC NULLS LAST, u.name ASC
       LIMIT 300`,
      params
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/students/route.ts");
    return NextResponse.json(body, { status });
  }
}
