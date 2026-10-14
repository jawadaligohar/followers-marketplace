import { Schema, models, model } from "mongoose";

const BonusClaimSchema = new Schema(
  {
    groupKey: { type: String, required: true, unique: true },
    sourceOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  },
  { timestamps: true, collection: "bonus_claims" },
);

const RewardRedemptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amountCents: { type: Number, required: true, min: 1 },
    kind: { type: String, enum: ["loyalty", "draw"], required: true },
    drawId: { type: Schema.Types.ObjectId, ref: "LuckyDraw", default: null },
  },
  { timestamps: true, collection: "reward_redemptions" },
);
RewardRedemptionSchema.index(
  { drawId: 1 },
  { unique: true, partialFilterExpression: { drawId: { $type: "objectId" } } },
);

const LuckyDrawSchema = new Schema(
  {
    month: { type: String, required: true, unique: true },
    winnerUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    winnerEmail: { type: String, required: true },
    sourceOrderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    totalEntries: { type: Number, required: true },
    prizeCents: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, collection: "lucky_draws" },
);

const EmailOutboxSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    status: { type: String, enum: ["pending", "sent"], default: "pending" },
    attempts: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    providerMessageId: { type: String, default: null },
  },
  { timestamps: true, collection: "email_outbox" },
);

const BankTransferSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true },
    kind: { type: String, enum: ["order", "topup"], required: true },
    orderIds: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    amountCents: { type: Number, required: true, min: 1 },
    confirmedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "bank_transfers" },
);

export const BonusClaim =
  models.BonusClaim || model("BonusClaim", BonusClaimSchema);
export const RewardRedemption =
  models.RewardRedemption || model("RewardRedemption", RewardRedemptionSchema);
export const LuckyDraw =
  models.LuckyDraw || model("LuckyDraw", LuckyDrawSchema);
if (
  process.env.NODE_ENV === "development" &&
  models.EmailOutbox &&
  !models.EmailOutbox.schema.path("attempts")
)
  delete models.EmailOutbox;
export const EmailOutbox =
  models.EmailOutbox || model("EmailOutbox", EmailOutboxSchema);
export const BankTransfer =
  models.BankTransfer || model("BankTransfer", BankTransferSchema);

const RefundRecordSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    amountCents: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, collection: "refund_records" },
);
const RefundReceiptSchema = new Schema(
  {
    providerKey: { type: String, required: true, unique: true },
    totalCents: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: "refund_receipts" },
);
export const RefundRecord =
  models.RefundRecord || model("RefundRecord", RefundRecordSchema);
export const RefundReceipt =
  models.RefundReceipt || model("RefundReceipt", RefundReceiptSchema);
