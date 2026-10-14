import mongoose, { Schema, models, model } from "mongoose";
import type { ServiceKind } from "@/lib/catalog";
import { PROVIDERS, type ProviderId } from "@/lib/supplier/providers";

export type OrderStatus =
  "pending" | "processing" | "completed" | "failed" | "cancelled";
export type PaymentSource = "wallet" | "card" | "crypto" | "bank" | "bonus";

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null;
  guestEmail: string | null;
  serviceId: mongoose.Types.ObjectId;
  platformId: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  targetLink: string;
  serviceKind: ServiceKind;
  postsCovered: number | null;
  comments: string[];
  pollOption: number | null;
  priceCents: number;
  paymentSource: PaymentSource;
  status: OrderStatus;
  supplierOrderId: string | null;
  supplierProvider: ProviderId | null;
  supplierServiceIdUsed: string | null;
  supplierLastCheckedAt: Date | null;
  supplierRefillId: string | null;
  supplierActionPending: string | null;
  merchantRefill: {
    requestId: string;
    status: "requested" | "completed";
    quantity: number;
    targetLink: string;
    reason: string;
    provider: ProviderId;
    externalOrderId?: string;
    requestedAt: Date;
    completedAt?: Date;
  } | null;
  merchantRefillHistory: NonNullable<IOrder["merchantRefill"]>[];
  supplierStatus: string | null;
  failureReason: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  cryptoCheckoutId: string | null;
  checkoutGroupId: string | null;
  paymentConfirmedAt: Date | null;
  refundedCents: number;
  customerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantRefillSchema = new Schema({
  requestId: { type: String, required: true },
  status: { type: String, enum: ["requested", "completed"], required: true },
  quantity: { type: Number, required: true },
  targetLink: { type: String, required: true },
  reason: { type: String, required: true },
  provider: { type: String, enum: PROVIDERS, required: true },
  externalOrderId: String,
  requestedAt: { type: Date, required: true },
  completedAt: Date,
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    guestEmail: { type: String, default: null, lowercase: true, trim: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    platformId: { type: String, required: true },
    platformLabel: { type: String, required: true },
    category: { type: String, required: true },
    qtyValue: { type: Number, required: true },
    targetLink: { type: String, required: true },
    serviceKind: {
      type: String,
      enum: ["standard", "auto", "comments", "poll"],
      default: "standard",
    },
    postsCovered: { type: Number, default: null },
    comments: { type: [String], default: [] },
    pollOption: { type: Number, default: null },
    priceCents: { type: Number, required: true },
    paymentSource: {
      type: String,
      enum: ["wallet", "card", "crypto", "bank", "bonus"],
      required: true,
    },
    checkoutGroupId: { type: String, default: null, index: true },
    paymentConfirmedAt: { type: Date, default: null, index: true },
    refundedCents: { type: Number, default: 0 },
    customerEmail: { type: String, default: null, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    supplierOrderId: { type: String, default: null },
    supplierProvider: {
      type: String,
      enum: [...PROVIDERS, null],
      default: null,
    },
    supplierServiceIdUsed: { type: String, default: null },
    supplierLastCheckedAt: { type: Date, default: null },
    supplierRefillId: { type: String, default: null },
    supplierActionPending: { type: String, default: null },
    merchantRefill: {
      type: MerchantRefillSchema,
      default: null,
    },
    merchantRefillHistory: { type: [MerchantRefillSchema], default: [] },
    supplierStatus: { type: String, default: null },
    failureReason: { type: String, default: null },
    stripeSessionId: { type: String, default: null, index: true },
    stripePaymentIntentId: { type: String, default: null, index: true },
    cryptoCheckoutId: { type: String, default: null, index: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "orders" },
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ guestEmail: 1, createdAt: -1 });
OrderSchema.index({ "merchantRefill.status": 1, createdAt: -1 });

// Development refresh can otherwise retain the schema from before new order fields existed.
if (
  process.env.NODE_ENV === "development" &&
  models.Order &&
  !models.Order.schema.path("merchantRefillHistory")
)
  mongoose.deleteModel("Order");
export const Order = models.Order || model<IOrder>("Order", OrderSchema);
