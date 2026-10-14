import { Schema, model, models } from "mongoose";
const schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    amountCents: { type: Number, required: true },
    invoiceId: { type: String, default: null },
    paymentId: { type: String, default: null },
  },
  { timestamps: true, collection: "crypto_invoices" },
);
schema.index(
  { invoiceId: 1 },
  { unique: true, partialFilterExpression: { invoiceId: { $type: "string" } } },
);
schema.index(
  { paymentId: 1 },
  { unique: true, partialFilterExpression: { paymentId: { $type: "string" } } },
);
export const CryptoInvoice =
  models.CryptoInvoice || model("CryptoInvoice", schema);
