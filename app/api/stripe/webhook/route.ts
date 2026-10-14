import { markOrdersPaid } from "@/lib/benefits";
import { recordExternalRefund } from "@/lib/refunds";
import { groupQuery, orderGroupKey } from "@/lib/orderAccess";
import { User } from "@/lib/db/models/User";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { Transaction } from "@/lib/db/models/Transaction";
import { applyWalletTransaction } from "@/lib/wallet";
import { fulfillOrder } from "@/lib/supplier/fulfillment";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "charge.refunded") {
    await dbConnect();
    const charge = event.data.object as Stripe.Charge;
    const intent =
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;
    if (!intent) return NextResponse.json({ received: true });
    let orders = await Order.find({ stripePaymentIntentId: intent });
    if (!orders.length) {
      const transaction = await Transaction.findOne({
        stripePaymentIntentId: intent,
      });
      const first = transaction?.relatedOrderId
        ? await Order.findById(transaction.relatedOrderId)
        : null;
      if (first) orders = await Order.find(groupQuery(orderGroupKey(first)));
    }
    if (orders.length)
      await recordExternalRefund(
        orders.map((order) => String(order._id)),
        charge.amount_refunded,
        `stripe:${intent}`,
      );
    return NextResponse.json({ received: true });
  }
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const checkoutSession = event.data.object as Stripe.Checkout.Session;
  const kind = checkoutSession.metadata?.kind;

  await dbConnect();

  // Idempotency: if we've already recorded a Transaction for this Stripe session, no-op.
  const existing = await Transaction.findOne({
    stripeSessionId: checkoutSession.id,
  });
  if (existing && kind === "wallet_topup") {
    return NextResponse.json({ received: true });
  }

  if (kind === "wallet_topup") {
    if (
      checkoutSession.payment_status !== "paid" ||
      checkoutSession.currency !== "usd"
    )
      return NextResponse.json({
        received: true,
        note: "Waiting for a paid USD session",
      });
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
    const orderIds =
      checkoutSession.metadata?.orderIds?.split(",").filter(Boolean) ??
      (checkoutSession.metadata?.orderId
        ? [checkoutSession.metadata.orderId]
        : []);
    const checkoutGroupId = checkoutSession.metadata?.checkoutGroupId;
    if (!checkoutGroupId && orderIds.length === 0)
      return NextResponse.json({ received: true });

    const orders = await Order.find({
      ...(checkoutGroupId ? { checkoutGroupId } : { _id: { $in: orderIds } }),
      paymentSource: "card",
    });
    if (orders.length === 0) {
      return NextResponse.json({ received: true });
    }

    if (
      checkoutSession.payment_status !== "paid" ||
      checkoutSession.currency !== "usd" ||
      checkoutSession.amount_total !==
        orders.reduce((sum, order) => sum + order.priceCents, 0)
    )
      return NextResponse.json(
        { error: "Payment amount or status does not match the order" },
        { status: 400 },
      );

    // Record a zero-effect ledger row purely for idempotency tracking on this session id.
    if (orders[0].userId)
      await Transaction.findOneAndUpdate(
        { stripeSessionId: checkoutSession.id },
        {
          $setOnInsert: {
            userId: orders[0].userId,
            type: "order_debit",
            amountCents: 0,
            balanceAfterCents:
              (
                await User.findById(orders[0].userId).select(
                  "walletBalanceCents",
                )
              )?.walletBalanceCents || 0,
            relatedOrderId: orders[0]._id,
            stripeSessionId: checkoutSession.id,
            stripePaymentIntentId:
              typeof checkoutSession.payment_intent === "string"
                ? checkoutSession.payment_intent
                : null,
            note: "Card payment confirmed via Stripe",
          },
        },
        { upsert: true },
      );

    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id;
    if (paymentIntentId)
      await Order.updateMany(
        { _id: { $in: orders.map((order) => order._id) } },
        { $set: { stripePaymentIntentId: paymentIntentId } },
      );
    await markOrdersPaid(orders.map((order) => String(order._id)));
    for (const order of orders) {
      if (order.status === "pending") await fulfillOrder(order);
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
