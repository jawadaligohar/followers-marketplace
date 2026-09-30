import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { Transaction } from "@/lib/db/models/Transaction";
import { applyWalletTransaction } from "@/lib/wallet";
import { supplierClient } from "@/lib/supplier";
import { Service } from "@/lib/db/models/Service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  const kind = checkoutSession.metadata?.kind;

  await dbConnect();

  // Idempotency: if we've already recorded a Transaction for this Stripe session, no-op.
  const existing = await Transaction.findOne({ stripeSessionId: checkoutSession.id });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  if (kind === "wallet_topup") {
    const userId = checkoutSession.metadata?.userId;
    if (!userId) return NextResponse.json({ received: true });

    await applyWalletTransaction({
      userId,
      type: "topup",
      amountCents: checkoutSession.amount_total ?? 0,
      stripeSessionId: checkoutSession.id,
      stripePaymentIntentId:
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : null,
      note: "Wallet top-up via Stripe",
    });

    return NextResponse.json({ received: true });
  }

  if (kind === "order_payment") {
    const orderIds = checkoutSession.metadata?.orderIds?.split(",").filter(Boolean) ?? [];
    if (orderIds.length === 0) return NextResponse.json({ received: true });

    const orders = await Order.find({ _id: { $in: orderIds }, status: "pending" });
    if (orders.length === 0) {
      return NextResponse.json({ received: true });
    }

    // Record a zero-effect ledger row purely for idempotency tracking on this session id.
    await Transaction.create({
      userId: orders[0].userId,
      type: "order_debit",
      amountCents: 0,
      balanceAfterCents: 0,
      relatedOrderId: orders[0]._id,
      stripeSessionId: checkoutSession.id,
      stripePaymentIntentId:
        typeof checkoutSession.payment_intent === "string"
          ? checkoutSession.payment_intent
          : null,
      note: "Card payment confirmed via Stripe",
    });

    for (const order of orders) {
      const service = await Service.findById(order.serviceId);

      try {
        const result = await supplierClient.submitOrder({
          supplierServiceId: service?.supplierServiceId ?? "mock",
          link: order.targetLink,
          quantity: order.qtyValue,
        });
        order.supplierOrderId = result.supplierOrderId;
        order.supplierStatus = result.status;
        order.status = "processing";
      } catch {
        order.status = "failed";
        order.failureReason = "Supplier submission failed";
      }

      await order.save();
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
