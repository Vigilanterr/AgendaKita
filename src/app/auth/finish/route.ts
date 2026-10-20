import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { dashboardForRole, getProfileStatus } from "@/lib/profile";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const status = await getProfileStatus(session.user.id);

  if (!status) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const target = status.needs_onboarding
    ? "/register/complete"
    : dashboardForRole(status.role);

  return NextResponse.redirect(new URL(target, request.url));
}
