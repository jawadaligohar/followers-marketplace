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
  if (!Number.isSafeInteger(opts.amountCents) || (["topup", "refund", "reward_credit"].includes(opts.type) && opts.amountCents <= 0) || (opts.type === "order_debit" && opts.amountCents > 0)) throw new Error("Invalid wallet amount");
  await Transaction.init();
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
    else {
      try { await session.withTransaction(execute); }
      catch (error) {
        const reference = opts.stripeSessionId ? { stripeSessionId: opts.stripeSessionId } : opts.nowpaymentsPaymentId ? { nowpaymentsPaymentId: opts.nowpaymentsPaymentId } : null;
        if (!(error && typeof error === "object" && "code" in error && error.code === 11000 && reference && opts.type === "topup")) throw error;
        // The losing transaction rolled its balance update back. A matching
        // committed receipt makes concurrent webhook delivery a successful no-op.
        const recorded = await Transaction.findOne(reference).lean();
        if (!recorded || String(recorded.userId) !== String(opts.userId) || recorded.type !== opts.type || recorded.amountCents !== opts.amountCents) throw error;
        nextBalance = recorded.balanceAfterCents;
      }
    }
  } finally {
    if (!existingSession) await session.endSession();
  }
  return nextBalance;
}
