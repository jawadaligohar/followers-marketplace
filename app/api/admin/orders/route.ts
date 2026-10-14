import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { getAdminOrders } from "@/lib/adminQueries";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await getAdminOrders(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  return NextResponse.json({
    orders: result.rows,
    total: result.total,
    page: result.page,
    pages: result.pages,
  });
}
