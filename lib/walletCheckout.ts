import mongoose from "mongoose";
import { Order } from "@/lib/db/models/Order";
import { applyWalletTransaction } from "@/lib/wallet";
import { markOrdersPaid } from "@/lib/benefits";
import { fulfillOrder } from "@/lib/supplier/fulfillment";
import type { ResolvedLine } from "@/lib/orderLine";

export async function createWalletOrders(
  lines: ResolvedLine[],
  userId: string,
  email: string,
  checkoutGroupId: string,
) {
  const session = await mongoose.startSession();
  let createdIds: string[] = [];
  try {
    await session.withTransaction(async () => {
      const orders = await Order.insertMany(
        lines.map((line) => ({
          ...line.orderFields,
          userId,
          customerEmail: email,
          checkoutGroupId,
          paymentSource: "wallet",
          status: "pending",
        })),
        { session },
      );
      await applyWalletTransaction(
        {
          userId,
          type: "order_debit",
          amountCents: -lines.reduce((sum, line) => sum + line.chargeCents, 0),
          note:
            lines.length === 1
              ? lines[0].name
              : `${lines.length} items from cart`,
          relatedOrderId: orders[0]._id,
        },
        session,
      );
      createdIds = orders.map((order) => String(order._id));
    });
  } finally {
    await session.endSession();
  }
  return Order.find({ _id: { $in: createdIds } }).sort({ _id: 1 });
}

export async function fulfillWalletOrders(
  orders: Awaited<ReturnType<typeof createWalletOrders>>,
) {
  await markOrdersPaid(orders.map((order) => String(order._id)));
  for (const order of orders) {
    const fulfillment = await fulfillOrder(String(order._id));
    if (!fulfillment.success && fulfillment.mode === "automated") {
      order.status = "failed";
      await order.save();
      await applyWalletTransaction({
        userId: order.userId!,
        type: "refund",
        amountCents: order.priceCents,
        relatedOrderId: order._id,
        note: `Refund: ${fulfillment.error || "Supplier submission failed"}`,
      });
    }
  }
}
