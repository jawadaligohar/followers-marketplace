import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getAdminUsers } from "@/lib/adminQueries";

async function getHandler(request: Request) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await getAdminUsers(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  return NextResponse.json({
    users: result.rows,
    total: result.total,
    page: result.page,
    pages: result.pages,
  });
}

export const GET = secureRoute(getHandler);
