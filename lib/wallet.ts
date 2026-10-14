import mongoose from "mongoose";
import { User } from "@/lib/db/models/User";
import { Transaction, TransactionType } from "@/lib/db/models/Transaction";
import { Order } from "@/lib/db/models/Order";
import { RefundRecord } from "@/lib/db/models/Benefits";

export class InsufficientBalanceError extends Error {
  constructor(public shortfallCents: number) {
    super("Insufficient wallet balance");
  }
}

export async function applyWalletTransaction(
  opts: {
    userId: mongoose.Types.ObjectId | string;
    type: TransactionType;
    amountCents: number; // signed: positive credits, negative debits
    relatedOrderId?: mongoose.Types.ObjectId | string | null;
    stripeSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    nowpaymentsInvoiceId?: string | null;
    nowpaymentsPaymentId?: string | null;
    note?: string | null;
  },
  existingSession?: mongoose.ClientSession,
) {
  const session = existingSession || (await mongoose.startSession());
  if (opts.type === "refund") await RefundRecord.init();
  let nextBalance = 0;
  const execute = async () => {
    const user = await User.findOneAndUpdate(
      {
        _id: opts.userId,
        ...(opts.amountCents < 0
          ? { walletBalanceCents: { $gte: -opts.amountCents } }
          : {}),
      },
      { $inc: { walletBalanceCents: opts.amountCents } },
      { returnDocument: "after", session },
    );
    if (!user) {
      const current = await User.findById(opts.userId).session(session);
      if (!current) throw new Error("User not found");
      throw new InsufficientBalanceError(
        -opts.amountCents - current.walletBalanceCents,
      );
    }
    nextBalance = user.walletBalanceCents;
    if (opts.type === "refund" && opts.relatedOrderId) {
      const refunded = await Order.findOneAndUpdate(
        {
          _id: opts.relatedOrderId,
          $expr: {
            $lte: [
              { $add: [{ $ifNull: ["$refundedCents", 0] }, opts.amountCents] },
              "$priceCents",
            ],
          },
        },
        { $inc: { refundedCents: opts.amountCents } },
        { session },
      );
      if (!refunded)
        throw new Error("Refund exceeds the remaining order payment");
      await RefundRecord.create(
        [{ orderId: opts.relatedOrderId, amountCents: opts.amountCents }],
        { session },
      );
    }
    await Transaction.create(
      [
        {
          userId: user._id,
          type: opts.type,
          amountCents: opts.amountCents,
          balanceAfterCents: nextBalance,
          relatedOrderId: opts.relatedOrderId ?? null,
          stripeSessionId: opts.stripeSessionId ?? null,
          stripePaymentIntentId: opts.stripePaymentIntentId ?? null,
          nowpaymentsInvoiceId: opts.nowpaymentsInvoiceId ?? null,
          nowpaymentsPaymentId: opts.nowpaymentsPaymentId ?? null,
          note: opts.note ?? null,
        },
      ],
      { session },
    );
  };
  try {
    if (existingSession) await execute();
    else await session.withTransaction(execute);
  } finally {
    if (!existingSession) await session.endSession();
  }
  return nextBalance;
}
