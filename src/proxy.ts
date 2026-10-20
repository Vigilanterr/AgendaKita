import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function dashboardFor(role: string | undefined) {
  if (role === "admin") return "/admin/dashboard";
  if (role === "teacher") return "/teacher/dashboard";
  return "/student/agenda";
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const session = await auth.api.getSession({ headers: request.headers });

  const isTeacherRoute = path.startsWith("/teacher");
  const isStudentRoute = path.startsWith("/student");
  const isAdminRoute = path.startsWith("/admin");

  if (!session && (isTeacherRoute || isStudentRoute || isAdminRoute)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session) {
    const role = session.user.role;

    if (path === "/login" || path === "/register") {
      return NextResponse.redirect(
        new URL(dashboardFor(role), request.url)
      );
    }

    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL(dashboardFor(role), request.url));
    }

    if (isTeacherRoute && role !== "teacher" && role !== "admin") {
      return NextResponse.redirect(new URL("/student/agenda", request.url));
    }

    if (isStudentRoute && role !== "student" && role !== "admin") {
      return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/teacher/:path*",
    "/student/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
