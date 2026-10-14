import { secureRoute } from "@/lib/security/request";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { adminTransactions } from "@/lib/adminActivity";
async function getHandler(request: Request) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const search = Object.fromEntries(new URL(request.url).searchParams);
  return NextResponse.json(
    await adminTransactions(
      search,
      /^[a-f\d]{24}$/i.test(search.user || "") ? search.user : undefined,
    ),
  );
}

export const GET = secureRoute(getHandler);
