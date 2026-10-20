import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  requireRole,
  errorResponse,
  getTeacherAssignments,
} from "@/lib/authz";

export type DiscussionRow = {
  id: number;
  task_id: number;
  body: string;
  created_at: string;
  author_name: string;
  author_role: string;
  task_title: string;
  class_name: string;
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
      scope = "AND t.class_id = ANY($1::int[])";
    }

    const { rows } = await query<DiscussionRow>(
      `SELECT
         c.id,
         c.task_id,
         c.content AS body,
         c.created_at,
         u.name AS author_name,
         u.role::text AS author_role,
         t.title AS task_title,
         cl.name AS class_name
       FROM task_comments c
       JOIN tasks t ON t.id = c.task_id
       JOIN users u ON u.id = c.user_id
       JOIN classes cl ON cl.id = t.class_id
       WHERE TRUE ${scope}
       ORDER BY c.created_at DESC, c.id DESC
       LIMIT 50`,
      params
    );

    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    const { status, body } = errorResponse(
      error,
      "src/app/api/teacher/discussions/route.ts"
    );
    return NextResponse.json(body, { status });
  }
}
