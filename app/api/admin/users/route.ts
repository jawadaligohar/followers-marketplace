import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const users = await User.find({}).sort({ createdAt: -1 }).select("-passwordHash").lean();

  return NextResponse.json({ users });
}
