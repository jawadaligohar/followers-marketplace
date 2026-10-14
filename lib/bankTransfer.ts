import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/connect";
import { BankTransfer } from "@/lib/db/models/Benefits";
import { Order } from "@/lib/db/models/Order";
import { User } from "@/lib/db/models/User";
import { Transaction } from "@/lib/db/models/Transaction";
import type { ResolvedLine } from "@/lib/orderLine";
import { markOrdersPaid } from "@/lib/benefits";
import { orderAccessToken } from "@/lib/orderAccess";
import { fulfillOrder } from "@/lib/supplier/fulfillment";

export function bankInstructions() {
  return process.env.BANK_TRANSFER_INSTRUCTIONS?.trim() || "";
}
export async function createBankTransfer(input: {
  email: string;
  userId?: string;
  lines?: ResolvedLine[];
  topupCents?: number;
}) {
  if (!bankInstructions())
    throw new Error("Bank transfers are not configured yet");
  await dbConnect();
  const reference = `bank_${randomUUID()}`;
  const amountCents =
    input.topupCents ??
    (input.lines ?? []).reduce((sum, line) => sum + line.fullPriceCents, 0);
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const orders = input.lines?.length
        ? await Order.insertMany(
            input.lines.map((line) => ({
              ...line.orderFields,
              priceCents: line.fullPriceCents,
              userId: input.userId || null,
              guestEmail: input.userId ? null : input.email,
              customerEmail: input.email,
              checkoutGroupId: reference,
              paymentSource: "bank",
              status: "pending",
            })),
            { session },
          )
        : [];
      await BankTransfer.create(
        [
          {
            reference,
            userId: input.userId || null,
            email: input.email,
            kind: input.topupCents ? "topup" : "order",
            orderIds: orders.map((o) => o._id),
            amountCents,
          },
        ],
        { session },
      );
    });
  } finally {
    await session.endSession();
  }
  return { reference, token: orderAccessToken(reference) };
}

export async function confirmBankTransfer(reference: string) {
  await dbConnect();
  const session = await mongoose.startSession();
  let orderIds: string[] = [];
  try {
    await session.withTransaction(async () => {
      const transfer = await BankTransfer.findOne({ reference }).session(
        session,
      );
      if (!transfer) throw new Error("Transfer not found");
      orderIds = transfer.orderIds.map(String);
      if (transfer.confirmedAt) return;
      transfer.confirmedAt = new Date();
      await transfer.save({ session });
      if (transfer.kind === "topup") {
        const user = await User.findByIdAndUpdate(
          transfer.userId,
          { $inc: { walletBalanceCents: transfer.amountCents } },
          { session, returnDocument: "after" },
        );
        if (!user) throw new Error("Account not found");
        await Transaction.create(
          [
            {
              userId: user._id,
              type: "topup",
              amountCents: transfer.amountCents,
              balanceAfterCents: user.walletBalanceCents,
              note: `Bank transfer ${reference}`,
            },
          ],
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }
  if (orderIds.length) {
    await markOrdersPaid(orderIds);
    for (const id of orderIds) {
      const order = await Order.findById(id);
      if (order?.status === "pending") await fulfillOrder(order);
    }
  }
}
