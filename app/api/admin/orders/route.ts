import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await dbConnect();
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .populate("userId", "name email")
    .lean();

  return NextResponse.json({ orders });
}
