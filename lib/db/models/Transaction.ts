import mongoose, { Schema, models, model } from "mongoose";

export type TransactionType = "topup" | "order_debit" | "refund" | "admin_adjustment";

export interface ITransaction {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  amountCents: number;
  balanceAfterCents: number;
  relatedOrderId: mongoose.Types.ObjectId | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  note: string | null;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["topup", "order_debit", "refund", "admin_adjustment"],
      required: true,
    },
    amountCents: { type: Number, required: true },
    balanceAfterCents: { type: Number, required: true },
    relatedOrderId: { type: Schema.Types.ObjectId, ref: "Order", default: null },
    stripeSessionId: { type: String, default: null },
    stripePaymentIntentId: { type: String, default: null },
    note: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "transactions" }
);

TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index(
  { stripeSessionId: 1 },
  { unique: true, sparse: true }
);

export const Transaction =
  models.Transaction || model<ITransaction>("Transaction", TransactionSchema);
