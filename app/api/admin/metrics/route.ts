import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getAdminMetrics } from "@/lib/adminQueries";
export async function GET() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getAdminMetrics());
}
