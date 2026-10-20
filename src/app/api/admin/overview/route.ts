import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse } from "@/lib/authz";

export async function GET() {
  try {
    await requireRole("admin");

    const [counts, recent, assignments] = await Promise.all([
      query<{
        students: string;
        teachers: string;
        classes: string;
        subjects: string;
        tasks: string;
        pending_discussions: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
          (SELECT COUNT(*) FROM users WHERE role = 'teacher') AS teachers,
          (SELECT COUNT(*) FROM classes WHERE archived_at IS NULL) AS classes,
          (SELECT COUNT(*) FROM subjects) AS subjects,
          (SELECT COUNT(*) FROM tasks) AS tasks,
          (SELECT COUNT(*) FROM task_comments c
             JOIN tasks t ON t.id = c.task_id
            WHERE t.teacher_id IS DISTINCT FROM c.user_id
          ) AS pending_discussions
      `),
      query<{
        id: number;
        title: string;
        class_name: string;
        subject_name: string | null;
        due_date: string;
        teacher_name: string;
      }>(`
        SELECT
          t.id,
          t.title,
          c.name AS class_name,
          s.name AS subject_name,
          t.due_date AT TIME ZONE 'Asia/Jakarta' AS due_date,
          u.name AS teacher_name
        FROM tasks t
        JOIN classes c ON c.id = t.class_id
        JOIN users u ON u.id = t.teacher_id
        LEFT JOIN subjects s ON s.id = t.subject_id
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT 8
      `),
      query<{
        id: number;
        teacher_name: string;
        class_name: string;
        subject_name: string;
      }>(`
        SELECT
          ta.id,
          u.name AS teacher_name,
          c.name AS class_name,
          s.name AS subject_name
        FROM teacher_assignments ta
        JOIN users u ON u.id = ta.teacher_id
        JOIN classes c ON c.id = ta.class_id
        JOIN subjects s ON s.id = ta.subject_id
        ORDER BY ta.id DESC
        LIMIT 8
      `),
    ]);

    const c = counts.rows[0];

    return NextResponse.json(
      {
        totals: {
          students: Number(c.students),
          teachers: Number(c.teachers),
          classes: Number(c.classes),
          subjects: Number(c.subjects),
          tasks: Number(c.tasks),
          pending_discussions: Number(c.pending_discussions),
        },
        recent_tasks: recent.rows,
        recent_assignments: assignments.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/admin/overview/route.ts");
    return NextResponse.json(body, { status });
  }
}
