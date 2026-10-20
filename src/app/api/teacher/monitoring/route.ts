import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRole, errorResponse, getTeacherAssignments } from "@/lib/authz";

const NOW_JKT = "(NOW() AT TIME ZONE 'Asia/Jakarta')";

type TotalsRow = {
  total_tasks: string;
  active_tasks: string;
  overdue_tasks: string;
  reminders_sent: string;
  due_today: string;
  due_this_week: string;
  drafts: string;
  total_students: string;
  total_classes: string;
};

type PerClassRow = {
  class_id: number;
  class_name: string;
  students_count: string;
  tasks_total: string;
  tasks_active: string;
  tasks_overdue: string;
  reminders_sent: string;
};

type UpcomingRow = {
  id: number;
  title: string;
  description: string | null;
  class_name: string;
  subject_name: string | null;
  due_date: string;
  reminder_offset_hours: number;
  is_notified: boolean;
};

export async function GET() {
  try {
    const user = await requireRole("teacher", "admin");

    const assignments =
      user.role === "teacher" ? await getTeacherAssignments(user.id) : [];

    if (user.role === "teacher" && assignments.length === 0) {
      return NextResponse.json(
        {
          totals: {
            total_tasks: 0,
            active_tasks: 0,
            overdue_tasks: 0,
            reminders_sent: 0,
            due_today: 0,
            due_this_week: 0,
            drafts: 0,
            total_students: 0,
            total_classes: 0,
          },
          per_class: [],
          upcoming: [],
        },
        { status: 200 }
      );
    }

    const classIds = assignments.map((a) => a.class_id);

    const [totalsRes, perClassRes, upcomingRes] = await Promise.all([
      query<TotalsRow>(`
        WITH scoped AS (
          SELECT * FROM tasks
          WHERE ${taskScope(user.role, classIds.length > 0)}
        )
        SELECT
          (SELECT COUNT(*) FROM scoped) AS total_tasks,
          (SELECT COUNT(*) FROM scoped WHERE due_date > ${NOW_JKT}) AS active_tasks,
          (SELECT COUNT(*) FROM scoped WHERE due_date <= ${NOW_JKT}) AS overdue_tasks,
          (SELECT COUNT(*) FROM scoped WHERE is_notified = TRUE) AS reminders_sent,
          (SELECT COUNT(*) FROM scoped
            WHERE due_date >= DATE_TRUNC('day', ${NOW_JKT})
              AND due_date <  DATE_TRUNC('day', ${NOW_JKT}) + INTERVAL '1 day'
          ) AS due_today,
          (SELECT COUNT(*) FROM scoped
            WHERE due_date >= ${NOW_JKT}
              AND due_date <  ${NOW_JKT} + INTERVAL '7 days'
          ) AS due_this_week,
          (SELECT COUNT(*) FROM scoped
            WHERE due_date - make_interval(hours => reminder_offset_hours) > ${NOW_JKT}
          ) AS drafts,
          (SELECT COUNT(*) FROM users u
            WHERE u.role = 'student' ${studentScope(user.role, classIds.length > 0)}
          ) AS total_students,
          (SELECT COUNT(*) FROM classes c
            WHERE c.archived_at IS NULL ${classScope(user.role, classIds.length > 0)}
          ) AS total_classes
      `, classIds.length > 0 ? [classIds] : []),
      query<PerClassRow>(`
        SELECT
          c.id AS class_id,
          c.name AS class_name,
          (SELECT COUNT(*) FROM users u WHERE u.class_id = c.id AND u.role = 'student') AS students_count,
          COUNT(t.id) AS tasks_total,
          COUNT(t.id) FILTER (WHERE t.due_date > ${NOW_JKT}) AS tasks_active,
          COUNT(t.id) FILTER (WHERE t.due_date <= ${NOW_JKT}) AS tasks_overdue,
          COUNT(t.id) FILTER (WHERE t.is_notified = TRUE) AS reminders_sent
        FROM classes c
        LEFT JOIN tasks t ON t.class_id = c.id
        WHERE c.archived_at IS NULL ${classScope(user.role, classIds.length > 0)}
        GROUP BY c.id, c.name
        ORDER BY c.name ASC
      `, classIds.length > 0 ? [classIds] : []),
      query<UpcomingRow>(`
        SELECT
          t.id,
          t.title,
          t.description,
          c.name AS class_name,
          s.name AS subject_name,
          t.due_date AT TIME ZONE 'Asia/Jakarta' AS due_date,
          t.reminder_offset_hours,
          t.is_notified
        FROM tasks t
        JOIN classes c ON t.class_id = c.id
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE t.due_date > ${NOW_JKT} ${scopeCondition(user.role, classIds.length > 0)}
        ORDER BY t.due_date ASC
        LIMIT 6
      `, classIds.length > 0 ? [classIds] : []),
    ]);

    const t = totalsRes.rows[0];

    return NextResponse.json(
      {
        totals: {
          total_tasks: Number(t.total_tasks),
          active_tasks: Number(t.active_tasks),
          overdue_tasks: Number(t.overdue_tasks),
          reminders_sent: Number(t.reminders_sent),
          due_today: Number(t.due_today),
          due_this_week: Number(t.due_this_week),
          drafts: Number(t.drafts),
          total_students: Number(t.total_students),
          total_classes: Number(t.total_classes),
        },
        per_class: perClassRes.rows.map((r) => ({
          class_id: r.class_id,
          class_name: r.class_name,
          students_count: Number(r.students_count),
          tasks_total: Number(r.tasks_total),
          tasks_active: Number(r.tasks_active),
          tasks_overdue: Number(r.tasks_overdue),
          reminders_sent: Number(r.reminders_sent),
        })),
        upcoming: upcomingRes.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/teacher/monitoring/route.ts");
    return NextResponse.json(body, { status });
  }
}

function scopeCondition(role: string, scoped: boolean) {
  return role === "teacher" && scoped ? "AND t.class_id = ANY($1::int[])" : "";
}

function taskScope(role: string, scoped: boolean) {
  return role === "teacher" && scoped ? "class_id = ANY($1::int[])" : "TRUE";
}

function studentScope(role: string, scoped: boolean) {
  return role === "teacher" && scoped ? "AND u.class_id = ANY($1::int[])" : "";
}

function classScope(role: string, scoped: boolean) {
  return role === "teacher" && scoped ? "AND c.id = ANY($1::int[])" : "";
}
