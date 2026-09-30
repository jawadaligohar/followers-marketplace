import mongoose, { Schema, models, model } from "mongoose";

export type OrderStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type PaymentSource = "wallet" | "card";

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  platformId: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  targetLink: string;
  priceCents: number;
  paymentSource: PaymentSource;
  status: OrderStatus;
  supplierOrderId: string | null;
  supplierStatus: string | null;
  failureReason: string | null;
  stripeSessionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    platformId: { type: String, required: true },
    platformLabel: { type: String, required: true },
    category: { type: String, required: true },
    qtyValue: { type: Number, required: true },
    targetLink: { type: String, required: true },
    priceCents: { type: Number, required: true },
    paymentSource: { type: String, enum: ["wallet", "card"], required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    supplierOrderId: { type: String, default: null },
    supplierStatus: { type: String, default: null },
    failureReason: { type: String, default: null },
    stripeSessionId: { type: String, default: null },
  },
  { timestamps: true, collection: "orders" }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
