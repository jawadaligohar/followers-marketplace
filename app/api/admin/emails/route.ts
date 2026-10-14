import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { adminEmailActivity } from "@/lib/adminActivity";
export async function GET(request: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(
    await adminEmailActivity(
      Object.fromEntries(new URL(request.url).searchParams),
    ),
  );
}
