import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";

const patchSchema = z.object({
  status: z.enum(["pending", "processing", "completed", "failed", "cancelled"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!/^[a-f\d]{24}$/i.test(id))
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await dbConnect();
  const existing = await Order.findById(id);
  if (!existing)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (
    ["processing", "completed"].includes(parsed.data.status) &&
    existing.paymentSource !== "bonus" &&
    (!existing.paymentConfirmedAt ||
      (existing.refundedCents || 0) >= existing.priceCents)
  )
    return NextResponse.json(
      {
        error:
          "Unpaid or fully refunded orders cannot be marked as processing or completed",
      },
      { status: 400 },
    );
  const order = await Order.findByIdAndUpdate(
    id,
    { status: parsed.data.status },
    { new: true },
  );
  if (!order)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ order });
}
