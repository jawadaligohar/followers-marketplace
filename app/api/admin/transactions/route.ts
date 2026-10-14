import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { adminTransactions } from "@/lib/adminActivity";
export async function GET(request: Request) {
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
