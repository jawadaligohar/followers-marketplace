import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { RefundRecord, RefundReceipt } from "@/lib/db/models/Benefits";

/** Record cumulative refunds already sent by the provider; never send money twice. */
export async function recordExternalRefund(
  orderIds: string[],
  totalCents: number,
  providerKey: string,
) {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0)
    throw new Error("Invalid refund total");
  await dbConnect();
  await Promise.all([RefundRecord.init(), RefundReceipt.init()]);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const receipt = await RefundReceipt.findOne({ providerKey }).session(
        session,
      );
      const previous = receipt?.totalCents || 0;
      if (totalCents <= previous) return;
      const orders = await Order.find({
        _id: { $in: orderIds },
        paymentSource: { $ne: "bonus" },
      })
        .sort({ _id: 1 })
        .session(session);
      const paidCents = orders.reduce(
        (sum, order) => sum + order.priceCents,
        0,
      );
      if (!orders.length || totalCents > paidCents)
        throw new Error("Refund exceeds the original payment");
      let remaining = totalCents - previous;
      for (const order of orders) {
        const amountCents = Math.min(
          remaining,
          Math.max(0, order.priceCents - (order.refundedCents || 0)),
        );
        if (!amountCents) continue;
        order.refundedCents = (order.refundedCents || 0) + amountCents;
        if (order.refundedCents === order.priceCents)
          order.status = "cancelled";
        await order.save({ session });
        await RefundRecord.create([{ orderId: order._id, amountCents }], {
          session,
        });
        remaining -= amountCents;
      }
      await RefundReceipt.findOneAndUpdate(
        { providerKey },
        { $set: { totalCents } },
        { session, upsert: true },
      );
    });
  } finally {
    await session.endSession();
  }
}
