import { secureRoute } from "@/lib/security/request";
import { markOrdersPaid } from "@/lib/benefits";
import { recordExternalRefund } from "@/lib/refunds";
import { User } from "@/lib/db/models/User";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { nowpayments } from "@/lib/nowpayments";
import { dbConnect } from "@/lib/db/connect";
import { Order } from "@/lib/db/models/Order";
import { Transaction } from "@/lib/db/models/Transaction";
import { fulfillOrder } from "@/lib/supplier/fulfillment";
import { validateCryptoPayment } from "@/lib/security/cryptoPayment";

async function postHandler(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    const reqHeaders = await headers();
    const sig = reqHeaders.get("x-nowpayments-sig");

    if (!sig || !nowpayments.verifySignature(body, sig)) {
      console.error("NOWPayments Webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { payment_id, invoice_id, payment_status, order_id } = body;
    if (
      payment_status === "refunded" &&
      typeof order_id === "string" &&
      order_id.startsWith("cart_")
    ) {
      await dbConnect();
      const orders = await Order.find({
        cryptoCheckoutId: order_id,
        paymentSource: "crypto",
        paymentConfirmedAt: { $ne: null },
      });
      if (orders.length) {
        await validateCryptoPayment(body, orders.reduce((sum, order) => sum + order.priceCents, 0));
        await recordExternalRefund(
          orders.map((order) => String(order._id)),
          orders.reduce((sum, order) => sum + order.priceCents, 0),
          `crypto:${order_id}`,
        );
      }
      return NextResponse.json({ received: true });
    }

    if (payment_status !== "finished") {
      return NextResponse.json({ received: true, status: payment_status });
    }

    if (typeof order_id !== "string" || !order_id.startsWith("cart_")) {
      return NextResponse.json({ received: true, note: "Ignored, not a cart" });
    }

    await dbConnect();

    const orders = await Order.find({ cryptoCheckoutId: order_id, paymentSource: "crypto" });
    if (orders.length === 0) {
      return NextResponse.json({
        received: true,
        note: "Orders already processed or not found",
      });
    }
    await validateCryptoPayment(body, orders.reduce((sum, order) => sum + order.priceCents, 0));

    // Ledger entry for auditing/idempotency tracking if order has an authenticated user
    const firstOrder = orders[0];
    if (firstOrder.userId) {
      await Transaction.findOneAndUpdate(
        { nowpaymentsPaymentId: String(payment_id) },
        {
          $setOnInsert: {
            userId: firstOrder.userId,
            type: "order_debit",
            amountCents: 0,
            balanceAfterCents:
              (
                await User.findById(firstOrder.userId).select(
                  "walletBalanceCents",
                )
              )?.walletBalanceCents || 0,
            relatedOrderId: firstOrder._id,
            nowpaymentsInvoiceId: invoice_id ? String(invoice_id) : null,
            nowpaymentsPaymentId: payment_id ? String(payment_id) : null,
            note: `Cart crypto payment confirmed via NOWPayments (${orders.length} items)`,
          },
        },
        { upsert: true },
      );
    }

    await markOrdersPaid(orders.map((order) => String(order._id)));
    for (const order of orders) {
      if (order.status === "pending") await fulfillOrder(String(order._id));
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error("NOWPayments cart webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

export const POST = secureRoute(postHandler);
