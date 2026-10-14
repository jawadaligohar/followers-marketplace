import { nowpayments, type CreateInvoiceParams } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { CryptoInvoice } from "@/lib/db/models/CryptoInvoice";

export async function createTrackedCryptoInvoice(
  params: CreateInvoiceParams,
  amountCents: number,
  userId?: string,
) {
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents < 1 ||
    params.price_currency !== "usd" ||
    Math.round(params.price_amount * 100) !== amountCents
  )
    throw new Error("Invalid invoice amount");
  await dbConnect();
  await CryptoInvoice.init();
  const intent = await CryptoInvoice.create({
    orderId: params.order_id,
    userId: userId || null,
    amountCents,
  });
  const invoice = await nowpayments.createInvoice(params);
  if (!/^\d+$/.test(String(invoice.id)))
    throw new Error("Invalid invoice reference");
  await CryptoInvoice.updateOne(
    { _id: intent._id },
    { $set: { invoiceId: String(invoice.id) } },
  );
  return invoice;
}

/** A signed notification is necessary but not sufficient: bind it to the exact
 * server-created invoice, expected USD amount and one processor payment ID. */
export async function validateCryptoPayment(
  body: Record<string, unknown>,
  expectedCents?: number,
) {
  if (
    typeof body.order_id !== "string" ||
    body.order_id.length > 200 ||
    !/^\d+$/.test(String(body.payment_id)) ||
    !/^\d+$/.test(String(body.invoice_id))
  )
    throw new Error("Invalid payment references");
  if (
    body.price_currency !== "usd" ||
    !Number.isFinite(Number(body.price_amount))
  )
    throw new Error("Expected a USD payment");
  await dbConnect();
  const invoice = await CryptoInvoice.findOne({
    orderId: body.order_id,
    invoiceId: String(body.invoice_id),
  });
  if (
    !invoice ||
    Math.round(Number(body.price_amount) * 100) !== invoice.amountCents ||
    (expectedCents !== undefined && invoice.amountCents !== expectedCents)
  )
    throw new Error("Payment does not match a server-created invoice");
  if (
    body.payment_status === "finished" &&
    body.actually_paid !== undefined &&
    body.pay_amount !== undefined
  ) {
    const actual = Number(body.actually_paid),
      required = Number(body.pay_amount);
    if (
      !Number.isFinite(actual) ||
      !Number.isFinite(required) ||
      required <= 0 ||
      actual + 1e-8 < required
    )
      throw new Error("Payment is incomplete");
  }
  const linked = await CryptoInvoice.findOneAndUpdate(
    {
      _id: invoice._id,
      $or: [{ paymentId: null }, { paymentId: String(body.payment_id) }],
    },
    { $set: { paymentId: String(body.payment_id) } },
  );
  if (!linked)
    throw new Error("Invoice is already bound to a different payment");
  return invoice;
}
