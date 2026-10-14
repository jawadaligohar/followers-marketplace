import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { fulfillOrder } from "@/lib/supplier/fulfillment";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  type ProviderId,
} from "@/lib/supplier/providers";

const dispatchSchema = z.object({
  supplierServiceId: z.string().optional(),
  provider: z.enum(PROVIDERS).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = dispatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();
  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const result = await fulfillOrder(order, {
    manualSupplierServiceId: parsed.data.supplierServiceId,
    provider: parsed.data.provider,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error || "Failed to dispatch order to supplier",
        order,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    message:
      result.mode === "automated"
        ? `Successfully dispatched to ${PROVIDER_LABELS[(order.supplierProvider || "peakerr") as ProviderId]} (#${result.supplierOrderId})`
        : "Order queued for manual fulfillment",
    order,
  });
}
