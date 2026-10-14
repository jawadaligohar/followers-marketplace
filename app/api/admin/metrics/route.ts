import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getAdminMetrics } from "@/lib/adminQueries";
async function getHandler() {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(await getAdminMetrics());
}

export const GET = secureRoute(getHandler);
