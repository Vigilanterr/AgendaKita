import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProfileStatus } from "@/lib/profile";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getProfileStatus(session.user.id);

  if (!status) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(status, { status: 200 });
}
