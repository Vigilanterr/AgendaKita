import { NextResponse } from "next/server";
import { requireRole, errorResponse, getTeacherAssignments } from "@/lib/authz";

export async function GET() {
  try {
    const user = await requireRole("teacher", "admin");

    if (user.role === "admin") {
      return NextResponse.json({ assignments: [], scope: "admin" }, { status: 200 });
    }

    const assignments = await getTeacherAssignments(user.id);

    return NextResponse.json(
      {
        scope: "teacher",
        assignments: assignments.map((a) => ({
          id: a.id,
          class_id: a.class_id,
          class_name: a.class_name,
          subject_id: a.subject_id,
          subject_name: a.subject_name,
          subject_code: a.subject_code,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    const { status, body } = errorResponse(error, "src/app/api/teacher/classes/route.ts");
    return NextResponse.json(body, { status });
  }
}
