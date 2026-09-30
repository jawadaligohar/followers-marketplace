import mongoose from "mongoose";
import { User } from "@/lib/db/models/User";
import { Transaction, TransactionType } from "@/lib/db/models/Transaction";

export class InsufficientBalanceError extends Error {
  constructor(public shortfallCents: number) {
    super("Insufficient wallet balance");
  }
}

export async function applyWalletTransaction(opts: {
  userId: mongoose.Types.ObjectId | string;
  type: TransactionType;
  amountCents: number; // signed: positive credits, negative debits
  relatedOrderId?: mongoose.Types.ObjectId | string | null;
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  note?: string | null;
}) {
  const user = await User.findById(opts.userId);
  if (!user) throw new Error("User not found");

  const nextBalance = user.walletBalanceCents + opts.amountCents;

  if (nextBalance < 0) {
    throw new InsufficientBalanceError(-nextBalance);
  }

  user.walletBalanceCents = nextBalance;
  await user.save();

  await Transaction.create({
    userId: user._id,
    type: opts.type,
    amountCents: opts.amountCents,
    balanceAfterCents: nextBalance,
    relatedOrderId: opts.relatedOrderId ?? null,
    stripeSessionId: opts.stripeSessionId ?? null,
    stripePaymentIntentId: opts.stripePaymentIntentId ?? null,
    note: opts.note ?? null,
  });

  return nextBalance;
}
