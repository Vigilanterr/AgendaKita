export function dashboardForRole(role: string): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "teacher") return "/teacher/dashboard";
  return "/student/agenda";
}
